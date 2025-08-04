const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { getDatabase } = require('../utils/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get comments for a confession
router.get('/confession/:confessionId', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { confessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const database = getDatabase();

    // Check if confession exists
    database.get(
      'SELECT id FROM confessions WHERE id = ?',
      [confessionId],
      (err, confession) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!confession) {
          return res.status(404).json({ error: 'Confession not found' });
        }

        // Get total count
        database.get(
          'SELECT COUNT(*) as total FROM comments WHERE confession_id = ?',
          [confessionId],
          (err, countResult) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);

            // Get comments with user info (anonymous)
            const query = `
              SELECT 
                c.id, c.content, c.upvotes, c.downvotes, c.created_at,
                'Anonymous' as user_handle
              FROM comments c
              WHERE c.confession_id = ?
              ORDER BY c.created_at ASC
              LIMIT ? OFFSET ?
            `;

            database.all(query, [confessionId, limit, offset], (err, comments) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                comments,
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages,
                  hasNext: page < totalPages,
                  hasPrev: page > 1
                }
              });
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to confession
router.post('/confession/:confessionId', [
  authenticateToken,
  body('content').isLength({ min: 1, max: 300 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { confessionId } = req.params;
    const { content } = req.body;
    const database = getDatabase();

    // Check if confession exists
    database.get(
      'SELECT id FROM confessions WHERE id = ?',
      [confessionId],
      (err, confession) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!confession) {
          return res.status(404).json({ error: 'Confession not found' });
        }

        // Insert comment
        database.run(
          'INSERT INTO comments (confession_id, user_id, content) VALUES (?, ?, ?)',
          [confessionId, req.user.id, content],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create comment' });
            }

            res.status(201).json({
              message: 'Comment added successfully',
              comment_id: this.lastID
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (only by owner or moderator)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const database = getDatabase();

  // Check if comment exists and user can delete it
  database.get(
    'SELECT user_id FROM comments WHERE id = ?',
    [id],
    (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Check if user is owner or has moderator privileges
      if (comment.user_id !== req.user.id) {
        // Check if user is moderator
        database.get(
          'SELECT karma, is_admin FROM users WHERE id = ?',
          [req.user.id],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (!user || (user.karma < 100 && !user.is_admin)) {
              return res.status(403).json({ error: 'Not authorized to delete this comment' });
            }

            deleteComment();
          }
        );
      } else {
        deleteComment();
      }

      function deleteComment() {
        database.run(
          'DELETE FROM comments WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to delete comment' });
            }

            res.json({ message: 'Comment deleted successfully' });
          }
        );
      }
    }
  );
});

// Vote on comment
router.post('/:id/vote', [
  authenticateToken,
  body('vote_type').isIn(['upvote', 'downvote'])
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { vote_type } = req.body;
    const database = getDatabase();

    // Check if comment exists
    database.get(
      'SELECT user_id FROM comments WHERE id = ?',
      [id],
      (err, comment) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!comment) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user is voting on their own comment
        if (comment.user_id === req.user.id) {
          return res.status(400).json({ error: 'Cannot vote on your own comment' });
        }

        // Check if user already voted
        database.get(
          'SELECT vote_type FROM votes WHERE user_id = ? AND content_type = ? AND content_id = ?',
          [req.user.id, 'comment', id],
          (err, existingVote) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (existingVote && existingVote.vote_type === vote_type) {
              return res.status(400).json({ error: 'Already voted this way' });
            }

            database.serialize(() => {
              if (existingVote) {
                // Update existing vote
                database.run(
                  'UPDATE votes SET vote_type = ? WHERE user_id = ? AND content_type = ? AND content_id = ?',
                  [vote_type, req.user.id, 'comment', id]
                );

                // Update comment vote counts
                if (existingVote.vote_type === 'upvote') {
                  database.run('UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?', [id]);
                } else {
                  database.run('UPDATE comments SET downvotes = downvotes - 1 WHERE id = ?', [id]);
                }
              } else {
                // Insert new vote
                database.run(
                  'INSERT INTO votes (user_id, content_type, content_id, vote_type) VALUES (?, ?, ?, ?)',
                  [req.user.id, 'comment', id, vote_type]
                );
              }

              // Update comment vote counts
              if (vote_type === 'upvote') {
                database.run('UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?', [id]);
              } else {
                database.run('UPDATE comments SET downvotes = downvotes + 1 WHERE id = ?', [id]);
              }

              // Update user karma
              const karmaChange = vote_type === 'upvote' ? 1 : -1;
              database.run(
                'UPDATE users SET karma = karma + ? WHERE id = ?',
                [karmaChange, comment.user_id]
              );

              res.json({ message: 'Vote recorded successfully' });
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 