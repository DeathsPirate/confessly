const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { getDatabase } = require('../utils/database');
const { authenticateToken, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Flag content (confession or comment)
router.post('/flag', [
  authenticateToken,
  body('content_type').isIn(['confession', 'comment']),
  body('content_id').isInt({ min: 1 }),
  body('reason').isLength({ min: 1, max: 200 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content_type, content_id, reason } = req.body;
    const database = getDatabase();

    // Check if content exists
    const tableName = content_type === 'confession' ? 'confessions' : 'comments';
    database.get(
      `SELECT id FROM ${tableName} WHERE id = ?`,
      [content_id],
      (err, content) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!content) {
          return res.status(404).json({ error: `${content_type} not found` });
        }

        // Check if user already flagged this content
        database.get(
          'SELECT id FROM flags WHERE user_id = ? AND content_type = ? AND content_id = ?',
          [req.user.id, content_type, content_id],
          (err, existingFlag) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (existingFlag) {
              return res.status(400).json({ error: 'Already flagged this content' });
            }

            // Create flag
            database.run(
              'INSERT INTO flags (user_id, content_type, content_id, reason) VALUES (?, ?, ?, ?)',
              [req.user.id, content_type, content_id, reason],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to create flag' });
                }

                res.status(201).json({
                  message: 'Content flagged successfully',
                  flag_id: this.lastID
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get flagged content (moderators only)
router.get('/flags', [
  requireModerator,
  query('status').optional().isIn(['pending', 'resolved', 'dismissed']),
  query('content_type').optional().isIn(['confession', 'comment']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, content_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const database = getDatabase();

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    if (content_type) {
      whereClause += ' AND f.content_type = ?';
      params.push(content_type);
    }

    // Get total count
    database.get(
      `SELECT COUNT(*) as total FROM flags f ${whereClause}`,
      params,
      (err, countResult) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        // Get flagged content with details
        const query = `
          SELECT 
            f.id, f.content_type, f.content_id, f.reason, f.status, f.created_at,
            u.handle as flagged_by,
            CASE 
              WHEN f.content_type = 'confession' THEN c.content
              WHEN f.content_type = 'comment' THEN cm.content
            END as content_text,
            CASE 
              WHEN f.content_type = 'confession' THEN c.user_id
              WHEN f.content_type = 'comment' THEN cm.user_id
            END as content_user_id
          FROM flags f
          LEFT JOIN users u ON f.user_id = u.id
          LEFT JOIN confessions c ON f.content_type = 'confession' AND f.content_id = c.id
          LEFT JOIN comments cm ON f.content_type = 'comment' AND f.content_id = cm.id
          ${whereClause}
          ORDER BY f.created_at DESC
          LIMIT ? OFFSET ?
        `;

        database.all(query, [...params, limit, offset], (err, flags) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            flags,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Resolve flag (moderators only)
router.put('/flags/:id/resolve', [
  requireModerator,
  body('action').isIn(['delete', 'dismiss']),
  body('reason').optional().isLength({ max: 200 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { action, reason } = req.body;
    const database = getDatabase();

    // Get flag details
    database.get(
      'SELECT content_type, content_id, status FROM flags WHERE id = ?',
      [id],
      (err, flag) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!flag) {
          return res.status(404).json({ error: 'Flag not found' });
        }

        if (flag.status !== 'pending') {
          return res.status(400).json({ error: 'Flag already processed' });
        }

        database.serialize(() => {
          if (action === 'delete') {
            // Delete the flagged content
            const tableName = flag.content_type === 'confession' ? 'confessions' : 'comments';
            database.run(
              `DELETE FROM ${tableName} WHERE id = ?`,
              [flag.content_id],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to delete content' });
                }

                if (this.changes === 0) {
                  return res.status(404).json({ error: 'Content not found' });
                }

                // Update flag status
                database.run(
                  'UPDATE flags SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                  ['resolved', id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to update flag' });
                    }

                    res.json({ message: 'Content deleted and flag resolved' });
                  }
                );
              }
            );
          } else {
            // Dismiss the flag
            database.run(
              'UPDATE flags SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              ['dismissed', id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to update flag' });
                }

                res.json({ message: 'Flag dismissed' });
              }
            );
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get moderation statistics (moderators only)
router.get('/stats', requireModerator, (req, res) => {
  const database = getDatabase();

  database.get(
    `SELECT 
      COUNT(*) as total_flags,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_flags,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_flags,
      SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed_flags,
      SUM(CASE WHEN content_type = 'confession' THEN 1 ELSE 0 END) as confession_flags,
      SUM(CASE WHEN content_type = 'comment' THEN 1 ELSE 0 END) as comment_flags
    FROM flags`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ stats });
    }
  );
});

module.exports = router; 