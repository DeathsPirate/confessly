const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../utils/database');

const router = express.Router();

// Export user data
router.get('/export', authenticateToken, (req, res) => {
  const database = getDatabase();

  // Get user profile
  database.get(
    'SELECT id, email, handle, bio, favorite_snack, karma, is_admin, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's confessions
      database.all(
        'SELECT id, content, mood, location, tagged_users, image_url, upvotes, downvotes, created_at FROM confessions WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, confessions) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get user's comments
          database.all(
            'SELECT id, confession_id, content, upvotes, downvotes, created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id],
            (err, comments) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              // Get user's votes
              database.all(
                'SELECT content_type, content_id, vote_type, created_at FROM votes WHERE user_id = ? ORDER BY created_at DESC',
                [req.user.id],
                (err, votes) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  // Get user's flags
                  database.all(
                    'SELECT content_type, content_id, reason, status, created_at FROM flags WHERE user_id = ? ORDER BY created_at DESC',
                    [req.user.id],
                    (err, flags) => {
                      if (err) {
                        return res.status(500).json({ error: 'Database error' });
                      }

                      // Create export data
                      const exportData = {
                        export_date: new Date().toISOString(),
                        user: {
                          id: user.id,
                          email: user.email,
                          handle: user.handle,
                          bio: user.bio,
                          favorite_snack: user.favorite_snack,
                          karma: user.karma,
                          is_admin: user.is_admin,
                          created_at: user.created_at
                        },
                        confessions: confessions.map(confession => ({
                          id: confession.id,
                          content: confession.content,
                          mood: confession.mood,
                          location: confession.location,
                          tagged_users: confession.tagged_users,
                          image_url: confession.image_url,
                          upvotes: confession.upvotes,
                          downvotes: confession.downvotes,
                          created_at: confession.created_at
                        })),
                        comments: comments.map(comment => ({
                          id: comment.id,
                          confession_id: comment.confession_id,
                          content: comment.content,
                          upvotes: comment.upvotes,
                          downvotes: comment.downvotes,
                          created_at: comment.created_at
                        })),
                        votes: votes.map(vote => ({
                          content_type: vote.content_type,
                          content_id: vote.content_id,
                          vote_type: vote.vote_type,
                          created_at: vote.created_at
                        })),
                        flags: flags.map(flag => ({
                          content_type: flag.content_type,
                          content_id: flag.content_id,
                          reason: flag.reason,
                          status: flag.status,
                          created_at: flag.created_at
                        })),
                        statistics: {
                          total_confessions: confessions.length,
                          total_comments: comments.length,
                          total_votes: votes.length,
                          total_flags: flags.length,
                          average_confession_upvotes: confessions.length > 0 ? 
                            confessions.reduce((sum, c) => sum + c.upvotes, 0) / confessions.length : 0,
                          average_comment_upvotes: comments.length > 0 ? 
                            comments.reduce((sum, c) => sum + c.upvotes, 0) / comments.length : 0
                        }
                      };

                      // Set response headers for file download
                      res.setHeader('Content-Type', 'application/json');
                      res.setHeader('Content-Disposition', `attachment; filename="confessly-export-${user.handle}-${new Date().toISOString().split('T')[0]}.json"`);
                      
                      res.json(exportData);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get user's own confessions (with full details)
router.get('/confessions', [
  authenticateToken
], (req, res) => {
  const database = getDatabase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get total count
  database.get(
    'SELECT COUNT(*) as total FROM confessions WHERE user_id = ?',
    [req.user.id],
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get user's confessions
      database.all(
        `SELECT id, content, mood, location, tagged_users, image_url, upvotes, downvotes, created_at
         FROM confessions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset],
        (err, confessions) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            confessions,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          });
        }
      );
    }
  );
});

// Get user's own comments
router.get('/comments', [
  authenticateToken
], (req, res) => {
  const database = getDatabase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get total count
  database.get(
    'SELECT COUNT(*) as total FROM comments WHERE user_id = ?',
    [req.user.id],
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get user's comments with confession context
      database.all(
        `SELECT 
          c.id, c.content, c.upvotes, c.downvotes, c.created_at,
          conf.content as confession_content,
          conf.id as confession_id
         FROM comments c
         LEFT JOIN confessions conf ON c.confession_id = conf.id
         WHERE c.user_id = ? 
         ORDER BY c.created_at DESC 
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset],
        (err, comments) => {
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
        }
      );
    }
  );
});

// Get user statistics
router.get('/stats', authenticateToken, (req, res) => {
  const database = getDatabase();

  // Get various statistics
  database.get(
    `SELECT 
      (SELECT COUNT(*) FROM confessions WHERE user_id = ?) as total_confessions,
      (SELECT COUNT(*) FROM comments WHERE user_id = ?) as total_comments,
      (SELECT COUNT(*) FROM votes WHERE user_id = ?) as total_votes,
      (SELECT COUNT(*) FROM flags WHERE user_id = ?) as total_flags,
      (SELECT SUM(upvotes) FROM confessions WHERE user_id = ?) as total_confession_upvotes,
      (SELECT SUM(downvotes) FROM confessions WHERE user_id = ?) as total_confession_downvotes,
      (SELECT SUM(upvotes) FROM comments WHERE user_id = ?) as total_comment_upvotes,
      (SELECT SUM(downvotes) FROM comments WHERE user_id = ?) as total_comment_downvotes`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate additional statistics
      const totalConfessionVotes = (stats.total_confession_upvotes || 0) + (stats.total_confession_downvotes || 0);
      const totalCommentVotes = (stats.total_comment_upvotes || 0) + (stats.total_comment_downvotes || 0);
      
      const enhancedStats = {
        ...stats,
        total_confession_upvotes: stats.total_confession_upvotes || 0,
        total_confession_downvotes: stats.total_confession_downvotes || 0,
        total_comment_upvotes: stats.total_comment_upvotes || 0,
        total_comment_downvotes: stats.total_comment_downvotes || 0,
        total_confession_votes: totalConfessionVotes,
        total_comment_votes: totalCommentVotes,
        average_confession_upvotes: stats.total_confessions > 0 ? 
          (stats.total_confession_upvotes || 0) / stats.total_confessions : 0,
        average_comment_upvotes: stats.total_comments > 0 ? 
          (stats.total_comment_upvotes || 0) / stats.total_comments : 0
      };

      res.json({ stats: enhancedStats });
    }
  );
});

module.exports = router; 