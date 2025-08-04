const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const { getDatabase } = require('../utils/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { generateAIComment } = require('../utils/aiService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'confession-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get confessions feed with optional search and pagination
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isLength({ max: 100 }),
  query('mood').optional().isLength({ max: 50 }),
  query('location').optional().isLength({ max: 100 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, mood, location } = req.query;
    const database = getDatabase();

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (content LIKE ? OR tagged_users LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (mood) {
      whereClause += ' AND mood = ?';
      params.push(mood);
    }

    if (location) {
      whereClause += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    // Get total count
    database.get(
      `SELECT COUNT(*) as total FROM confessions ${whereClause}`,
      params,
      (err, countResult) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        // Get confessions with user info (anonymous)
        const query = `
          SELECT 
            c.id, c.content, c.mood, c.location, c.tagged_users, 
            c.image_url, c.upvotes, c.downvotes, c.created_at,
            'Anonymous' as user_handle
          FROM confessions c
          ${whereClause}
          ORDER BY c.created_at DESC
          LIMIT ? OFFSET ?
        `;

        database.all(query, [...params, limit, offset], (err, confessions) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Add full URL to image_url if it exists
          const confessionsWithFullUrls = confessions.map(confession => ({
            ...confession,
            image_url: confession.image_url ? `http://localhost:5000${confession.image_url}` : null
          }));

          res.json({
            confessions: confessionsWithFullUrls,
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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific confession
router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  const database = getDatabase();

  database.get(
    `SELECT 
      c.id, c.content, c.mood, c.location, c.tagged_users, 
      c.image_url, c.upvotes, c.downvotes, c.created_at,
      'Anonymous' as user_handle
    FROM confessions c
    WHERE c.id = ?`,
    [id],
    (err, confession) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!confession) {
        return res.status(404).json({ error: 'Confession not found' });
      }

      // Add full URL to image_url if it exists
      const confessionWithFullUrl = {
        ...confession,
        image_url: confession.image_url ? `http://localhost:5000${confession.image_url}` : null
      };

      res.json({ confession: confessionWithFullUrl });
    }
  );
});

// Create new confession
router.post('/', authenticateToken, (req, res) => {
  // Handle file upload first
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.log('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    try {
      console.log('Confession creation request body:', req.body);
      console.log('Confession creation request file:', req.file);
      
      // Run validation after multer has parsed the body
      const validationErrors = [];
      
      // Validate content
      if (!req.body.content || req.body.content.length < 1 || req.body.content.length > 500) {
        validationErrors.push({
          type: 'field',
          value: req.body.content,
          msg: 'Content must be between 1 and 500 characters',
          path: 'content',
          location: 'body'
        });
      }
      
      // Validate mood
      if (req.body.mood && req.body.mood.length > 50) {
        validationErrors.push({
          type: 'field',
          value: req.body.mood,
          msg: 'Mood must be 50 characters or less',
          path: 'mood',
          location: 'body'
        });
      }
      
      // Validate location
      if (req.body.location && req.body.location.length > 100) {
        validationErrors.push({
          type: 'field',
          value: req.body.location,
          msg: 'Location must be 100 characters or less',
          path: 'location',
          location: 'body'
        });
      }
      
      // Validate tagged_users
      if (req.body.tagged_users && req.body.tagged_users.length > 200) {
        validationErrors.push({
          type: 'field',
          value: req.body.tagged_users,
          msg: 'Tagged users must be 200 characters or less',
          path: 'tagged_users',
          location: 'body'
        });
      }
      
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        return res.status(400).json({ errors: validationErrors });
      }

    const { content, mood, location, tagged_users } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const database = getDatabase();

    database.run(
      `INSERT INTO confessions (user_id, content, mood, location, tagged_users, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, content, mood || null, location || null, tagged_users || null, image_url],
      async function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create confession' });
        }

        const confessionId = this.lastID;

        // Generate AI comment if enabled
        console.log('Confession created successfully, attempting to generate AI comment...');
        try {
          const aiComment = await generateAIComment(content, mood, location);
          console.log('AI comment result:', aiComment);
          if (aiComment) {
            // Create a special AI user if it doesn't exist
            database.get(
              'SELECT id FROM users WHERE email = ?',
              ['ai@confessly.com'],
              (err, aiUser) => {
                if (err) {
                  console.error('Error checking AI user:', err);
                  return;
                }

                if (!aiUser) {
                  // Create AI user
                  database.run(
                    `INSERT INTO users (email, password, handle, bio, favorite_snack, karma, is_admin)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    ['ai@confessly.com', 'ai-user-no-login', 'Confessly AI', 'Your friendly AI assistant', 'Digital cookies', 1000, false],
                    function(err) {
                      if (err) {
                        console.error('Error creating AI user:', err);
                        return;
                      }
                      
                      // Add AI comment
                      addAIComment(database, confessionId, aiComment);
                    }
                  );
                } else {
                  // Add AI comment
                  addAIComment(database, confessionId, aiComment);
                }
              }
            );
          }
        } catch (error) {
          console.error('Error generating AI comment:', error);
        }

        res.status(201).json({
          message: 'Confession created successfully',
          confession_id: confessionId
        });
      }
    );
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Update confession (only by owner)
router.put('/:id', [
  authenticateToken,
  body('content').optional().isLength({ min: 1, max: 500 }),
  body('mood').optional().isLength({ max: 50 }),
  body('location').optional().isLength({ max: 100 }),
  body('tagged_users').optional().isLength({ max: 200 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content, mood, location, tagged_users } = req.body;
    const database = getDatabase();

    // Check if confession exists and user owns it
    database.get(
      'SELECT user_id FROM confessions WHERE id = ?',
      [id],
      (err, confession) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!confession) {
          return res.status(404).json({ error: 'Confession not found' });
        }

        if (confession.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized to edit this confession' });
        }

        const updates = [];
        const values = [];

        if (content !== undefined) {
          updates.push('content = ?');
          values.push(content);
        }
        if (mood !== undefined) {
          updates.push('mood = ?');
          values.push(mood);
        }
        if (location !== undefined) {
          updates.push('location = ?');
          values.push(location);
        }
        if (tagged_users !== undefined) {
          updates.push('tagged_users = ?');
          values.push(tagged_users);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        database.run(
          `UPDATE confessions SET ${updates.join(', ')} WHERE id = ?`,
          values,
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to update confession' });
            }

            res.json({ message: 'Confession updated successfully' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete confession (only by owner or moderator)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const database = getDatabase();

  // Check if confession exists and user can delete it
  database.get(
    'SELECT user_id FROM confessions WHERE id = ?',
    [id],
    (err, confession) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!confession) {
        return res.status(404).json({ error: 'Confession not found' });
      }

      // Check if user is owner or has moderator privileges
      if (confession.user_id !== req.user.id) {
        // Check if user is moderator
        database.get(
          'SELECT karma, is_admin FROM users WHERE id = ?',
          [req.user.id],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (!user || (user.karma < 100 && !user.is_admin)) {
              return res.status(403).json({ error: 'Not authorized to delete this confession' });
            }

            deleteConfession();
          }
        );
      } else {
        deleteConfession();
      }

      function deleteConfession() {
        database.run(
          'DELETE FROM confessions WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to delete confession' });
            }

            res.json({ message: 'Confession deleted successfully' });
          }
        );
      }
    }
  );
});

// Vote on confession
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

    // Check if confession exists
    database.get(
      'SELECT user_id FROM confessions WHERE id = ?',
      [id],
      (err, confession) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!confession) {
          return res.status(404).json({ error: 'Confession not found' });
        }

        // Check if user is voting on their own confession
        if (confession.user_id === req.user.id) {
          return res.status(400).json({ error: 'Cannot vote on your own confession' });
        }

        // Check if user already voted
        database.get(
          'SELECT vote_type FROM votes WHERE user_id = ? AND content_type = ? AND content_id = ?',
          [req.user.id, 'confession', id],
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
                  [vote_type, req.user.id, 'confession', id]
                );

                // Update confession vote counts
                if (existingVote.vote_type === 'upvote') {
                  database.run('UPDATE confessions SET upvotes = upvotes - 1 WHERE id = ?', [id]);
                } else {
                  database.run('UPDATE confessions SET downvotes = downvotes - 1 WHERE id = ?', [id]);
                }
              } else {
                // Insert new vote
                database.run(
                  'INSERT INTO votes (user_id, content_type, content_id, vote_type) VALUES (?, ?, ?, ?)',
                  [req.user.id, 'confession', id, vote_type]
                );
              }

              // Update confession vote counts
              if (vote_type === 'upvote') {
                database.run('UPDATE confessions SET upvotes = upvotes + 1 WHERE id = ?', [id]);
              } else {
                database.run('UPDATE confessions SET downvotes = downvotes + 1 WHERE id = ?', [id]);
              }

              // Update user karma
              const karmaChange = vote_type === 'upvote' ? 1 : -1;
              database.run(
                'UPDATE users SET karma = karma + ? WHERE id = ?',
                [karmaChange, confession.user_id]
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

// Helper function to add AI comment
function addAIComment(database, confessionId, commentText) {
  database.get(
    'SELECT id FROM users WHERE email = ?',
    ['ai@confessly.com'],
    (err, aiUser) => {
      if (err || !aiUser) {
        console.error('Error getting AI user for comment:', err);
        return;
      }

      database.run(
        `INSERT INTO comments (confession_id, user_id, content)
         VALUES (?, ?, ?)`,
        [confessionId, aiUser.id, commentText],
        function(err) {
          if (err) {
            console.error('Error adding AI comment:', err);
          } else {
            console.log(`AI comment added to confession ${confessionId}`);
          }
        }
      );
    }
  );
}

module.exports = router; 