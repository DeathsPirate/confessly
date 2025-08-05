const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const confessionRoutes = require('./routes/confessions');
const commentRoutes = require('./routes/comments');
const moderationRoutes = require('./routes/moderation');
const userRoutes = require('./routes/user');
const { initDatabase } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3003'];
console.log('CORS Origins:', corsOrigins);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers for images
app.use('/uploads', (req, res, next) => {
  // Debug logging for image requests
  console.log('Image request:', req.url);
  console.log('Uploads directory exists:', require('fs').existsSync(path.join(__dirname, 'uploads')));
  
  // Allow specific origins for images
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost:3000') || origin.includes('localhost:3003'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to check uploads directory
app.get('/api/debug/uploads', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  try {
    const exists = require('fs').existsSync(uploadsPath);
    const files = exists ? require('fs').readdirSync(uploadsPath) : [];
    res.json({
      uploadsPath,
      exists,
      files,
      currentDir: __dirname,
      currentDirContents: require('fs').readdirSync(__dirname)
    });
  } catch (error) {
    res.json({ error: error.message, uploadsPath, currentDir: __dirname });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(clientBuildPath, 'index.html');
  
  console.log('Production mode detected');
  console.log('Looking for React build at:', clientBuildPath);
  console.log('Current directory:', __dirname);
  console.log('Build directory exists:', require('fs').existsSync(clientBuildPath));
  
  // List contents of parent directory
  try {
    const parentDir = path.join(__dirname, '..');
    const parentContents = require('fs').readdirSync(parentDir);
    console.log('Parent directory contents:', parentContents);
  } catch (error) {
    console.log('Error reading parent directory:', error.message);
  }
  
  // Check if React build exists
  if (require('fs').existsSync(clientBuildPath)) {
    console.log('React build found! Serving full application...');
    // Serve static files from the React build
    app.use(express.static(clientBuildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    // React build doesn't exist, serve API only
    console.log('React build not found, serving API only');
    console.log('Available directories in current location:');
    try {
      const currentContents = require('fs').readdirSync(__dirname);
      console.log('Current directory contents:', currentContents);
    } catch (error) {
      console.log('Error reading current directory:', error.message);
    }
    
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Confessly API is running',
        status: 'API only mode',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          confessions: '/api/confessions',
          comments: '/api/comments',
          user: '/api/user',
          moderation: '/api/moderation'
        }
      });
    });
    
    // 404 handler for API-only mode
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Ensure uploads directory exists
    const uploadsPath = path.join(__dirname, 'uploads');
    if (!require('fs').existsSync(uploadsPath)) {
      require('fs').mkdirSync(uploadsPath, { recursive: true });
      console.log('Created uploads directory:', uploadsPath);
    } else {
      console.log('Uploads directory already exists:', uploadsPath);
    }
    
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Confessly server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 