const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('handle').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('bio').optional().isLength({ max: 200 }),
  body('favorite_snack').optional().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, handle, bio, favorite_snack } = req.body;
    const database = getDatabase();

    // Check if email or handle already exists
    database.get(
      'SELECT id FROM users WHERE email = ? OR handle = ?',
      [email, handle],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ 
            error: 'Email or handle already exists' 
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        database.run(
          `INSERT INTO users (email, password, handle, bio, favorite_snack)
           VALUES (?, ?, ?, ?, ?)`,
          [email, hashedPassword, handle, bio || '', favorite_snack || ''],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Generate JWT token
            const token = jwt.sign(
              { id: this.lastID, email, handle },
              process.env.JWT_SECRET,
              { expiresIn: '7d' }
            );

            res.status(201).json({
              message: 'User registered successfully',
              token,
              user: {
                id: this.lastID,
                email,
                handle,
                bio: bio || '',
                favorite_snack: favorite_snack || '',
                karma: 0
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const database = getDatabase();

    database.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, handle: user.handle },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            handle: user.handle,
            bio: user.bio,
            favorite_snack: user.favorite_snack,
            karma: user.karma,
            is_admin: user.is_admin
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const database = getDatabase();

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

      res.json({ user });
    }
  );
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('bio').optional().isLength({ max: 200 }),
  body('favorite_snack').optional().isLength({ max: 50 }),
  body('handle').optional().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/)
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bio, favorite_snack, handle } = req.body;
    const database = getDatabase();

    // Check if handle is already taken (if provided)
    if (handle) {
      database.get(
        'SELECT id FROM users WHERE handle = ? AND id != ?',
        [handle, req.user.id],
        (err, existingUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Handle already taken' });
          }

          updateProfile();
        }
      );
    } else {
      updateProfile();
    }

    function updateProfile() {
      const updates = [];
      const values = [];

      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (favorite_snack !== undefined) {
        updates.push('favorite_snack = ?');
        values.push(favorite_snack);
      }
      if (handle !== undefined) {
        updates.push('handle = ?');
        values.push(handle);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user.id);

      database.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ message: 'Profile updated successfully' });
        }
      );
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create admin account (first-time setup)
router.post('/create-admin', (req, res) => {
  const { email, password, handle, adminSecret } = req.body;
  
  // Check admin secret (you should set this in environment variables)
  const requiredSecret = process.env.ADMIN_SECRET || 'confessly-admin-2024';
  if (adminSecret !== requiredSecret) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  
  // Validate input
  if (!email || !password || !handle) {
    return res.status(400).json({ error: 'Email, password, and handle are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  const database = getDatabase();
  
  // Check if admin already exists
  database.get('SELECT id FROM users WHERE is_admin = 1', (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (admin) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }
    
    // Check if email already exists
    database.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing error' });
        }
        
        // Create admin user
        database.run(
          `INSERT INTO users (email, password, handle, bio, favorite_snack, karma, is_admin)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [email, hashedPassword, handle, 'Admin account', 'Admin snacks', 1000, true],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create admin account' });
            }
            
            res.status(201).json({ 
              message: 'Admin account created successfully',
              user_id: this.lastID
            });
          }
        );
      });
    });
  });
});

// Debug endpoint to check admin accounts (remove in production)
router.get('/debug/admins', (req, res) => {
  const database = getDatabase();
  
  database.all('SELECT id, email, handle, is_admin, karma FROM users WHERE is_admin = 1', (err, admins) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ 
      adminCount: admins.length,
      admins: admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        handle: admin.handle,
        is_admin: admin.is_admin,
        karma: admin.karma
      }))
    });
  });
});

// Reset admin accounts (for development/testing - remove in production)
router.post('/reset-admins', (req, res) => {
  const { adminSecret } = req.body;
  
  // Check admin secret
  const requiredSecret = process.env.ADMIN_SECRET || 'confessly-admin-2024';
  if (adminSecret !== requiredSecret) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  
  const database = getDatabase();
  
  database.run('UPDATE users SET is_admin = 0', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ message: 'All admin accounts have been reset. You can now create a new admin account.' });
  });
});

module.exports = router; 