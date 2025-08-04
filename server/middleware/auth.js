const jwt = require('jsonwebtoken');
const { getDatabase } = require('../utils/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireModerator = async (req, res, next) => {
  try {
    const database = getDatabase();
    
    database.get(
      'SELECT karma, is_admin FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.karma < 100 && !user.is_admin) {
          return res.status(403).json({ 
            error: 'Moderator access required (100+ karma or admin status)' 
          });
        }
        
        req.userRole = user.is_admin ? 'admin' : 'moderator';
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const database = getDatabase();
    
    database.get(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        if (!user.is_admin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  requireModerator,
  requireAdmin,
  optionalAuth
}; 