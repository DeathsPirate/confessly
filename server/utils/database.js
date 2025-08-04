const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/confessly.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

async function initDatabase() {
  const database = getDatabase();
  
  return new Promise((resolve, reject) => {
    database.serialize(() => {
      // Users table
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          handle TEXT UNIQUE NOT NULL,
          bio TEXT,
          favorite_snack TEXT,
          karma INTEGER DEFAULT 0,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Confessions table
      database.run(`
        CREATE TABLE IF NOT EXISTS confessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          mood TEXT,
          location TEXT,
          tagged_users TEXT,
          image_url TEXT,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Comments table
      database.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          confession_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (confession_id) REFERENCES confessions (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Votes table
      database.run(`
        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          vote_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, content_type, content_id),
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Flags table
      database.run(`
        CREATE TABLE IF NOT EXISTS flags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      database.run('CREATE INDEX IF NOT EXISTS idx_confessions_user_id ON confessions(user_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at)');
      database.run('CREATE INDEX IF NOT EXISTS idx_comments_confession_id ON comments(confession_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_votes_content ON votes(content_type, content_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_flags_status ON flags(status)');

      // Seed sample data
      seedSampleData(database).then(() => {
        console.log('Database initialization completed');
        resolve();
      }).catch(reject);
    });
  });
}

async function seedSampleData(database) {
  return new Promise((resolve, reject) => {
    // Check if sample data already exists
    database.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        console.log('Sample data already exists, skipping seeding');
        resolve();
        return;
      }

      console.log('Seeding sample data...');
      
      // Create sample users
      const sampleUsers = [
        {
          email: 'user1@test.com',
          password: bcrypt.hashSync('password123', 10),
          handle: 'confessor1',
          bio: 'Just trying to be honest with myself',
          favorite_snack: 'Chocolate chip cookies',
          karma: 25
        },
        {
          email: 'user2@test.com',
          password: bcrypt.hashSync('password123', 10),
          handle: 'anonymous_soul',
          bio: 'Living life one confession at a time',
          favorite_snack: 'Popcorn',
          karma: 15
        },
        {
          email: 'moderator@test.com',
          password: bcrypt.hashSync('password123', 10),
          handle: 'community_guardian',
          bio: 'Keeping the community safe and supportive',
          favorite_snack: 'Trail mix',
          karma: 150
        },
        {
          email: 'admin@confessly.com',
          password: bcrypt.hashSync('admin123', 10),
          handle: 'admin',
          bio: 'System administrator',
          favorite_snack: 'Coffee',
          karma: 1000,
          is_admin: 1
        }
      ];

      const insertUser = database.prepare(`
        INSERT INTO users (email, password, handle, bio, favorite_snack, karma, is_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      sampleUsers.forEach(user => {
        insertUser.run(
          user.email,
          user.password,
          user.handle,
          user.bio,
          user.favorite_snack,
          user.karma,
          user.is_admin || 0
        );
      });

      insertUser.finalize((err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create sample confessions
        const sampleConfessions = [
          {
            user_id: 1,
            content: 'I secretly judge people who don\'t use turn signals. It\'s become my personal pet peeve.',
            mood: 'Annoyed',
            location: 'Highway',
            tagged_users: '@bad_drivers'
          },
          {
            user_id: 2,
            content: 'I pretend to be busy on my phone when I see someone I know but don\'t want to talk to.',
            mood: 'Guilty',
            location: 'Public places',
            tagged_users: '@awkward_encounters'
          },
          {
            user_id: 3,
            content: 'I\'ve been secretly learning to play the guitar for 6 months but haven\'t told anyone yet.',
            mood: 'Excited',
            location: 'Home',
            tagged_users: '@music_lovers'
          },
          {
            user_id: 1,
            content: 'I still sleep with a stuffed animal. I\'m 28 years old.',
            mood: 'Embarrassed',
            location: 'Bedroom',
            tagged_users: '@adult_kids'
          }
        ];

        const insertConfession = database.prepare(`
          INSERT INTO confessions (user_id, content, mood, location, tagged_users)
          VALUES (?, ?, ?, ?, ?)
        `);

        sampleConfessions.forEach(confession => {
          insertConfession.run(
            confession.user_id,
            confession.content,
            confession.mood,
            confession.location,
            confession.tagged_users
          );
        });

        insertConfession.finalize((err) => {
          if (err) {
            reject(err);
            return;
          }

          // Create sample comments
          const sampleComments = [
            {
              confession_id: 1,
              user_id: 2,
              content: 'I feel this so much! It drives me crazy too.'
            },
            {
              confession_id: 1,
              user_id: 3,
              content: 'You\'re not alone in this frustration.'
            },
            {
              confession_id: 2,
              user_id: 1,
              content: 'We\'ve all been there. It\'s totally normal!'
            },
            {
              confession_id: 3,
              user_id: 2,
              content: 'That\'s awesome! You should share your progress sometime.'
            }
          ];

          const insertComment = database.prepare(`
            INSERT INTO comments (confession_id, user_id, content)
            VALUES (?, ?, ?)
          `);

          sampleComments.forEach(comment => {
            insertComment.run(
              comment.confession_id,
              comment.user_id,
              comment.content
            );
          });

          insertComment.finalize((err) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('Sample data seeded successfully');
            resolve();
          });
        });
      });
    });
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase
}; 