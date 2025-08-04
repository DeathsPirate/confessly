# Confessly - Anonymous Confession Platform

A social web application where users can anonymously post confessions, interact with others' posts, and earn karma based on community engagement. Features include AI-powered responses, image uploads, moderation tools, and user data export.

## Features

- **User Authentication**: Secure JWT-based authentication
- **Anonymous Confessions**: Post confessions with mood, location, and image attachments
- **AI Assistant**: AI responds to confessions with empathetic advice (🤖 serious, ✨ fun)
- **Voting System**: Upvote/downvote confessions and comments
- **Karma System**: Earn karma based on community engagement
- **Moderation Tools**: Flag content, delete posts, suspend users (100+ karma required)
- **Search & Filter**: Search by mood, keyword, or location
- **Data Export**: Export user data in JSON format
- **Image Uploads**: Attach images to confessions
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Authentication**: JWT with bcrypt
- **File Uploads**: Multer
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Containerization**: Docker & Docker Compose

## Quick Start (Local Development)

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Confessly
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp server/env.example server/.env

# Edit the .env file and add your OpenAI API key (optional)
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start the Application
```bash
# Start both frontend and backend
docker-compose up -d

# Or start with rebuild
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Deployment

### Option 1: Railway (Recommended)

1. **Fork/Clone** this repository to your GitHub account
2. **Sign up** at [Railway](https://railway.app)
3. **Connect** your GitHub repository
4. **Set Environment Variables**:
   - `JWT_SECRET`: Generate a secure random string
   - `CORS_ORIGIN`: Your Railway app URL
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `REACT_APP_API_URL`: Your Railway API URL
5. **Deploy** - Railway will automatically build and deploy your app

### Option 2: Render

1. **Sign up** at [Render](https://render.com)
2. **Create a new Web Service**
3. **Connect** your GitHub repository
4. **Configure**:
   - **Build Command**: `docker-compose -f docker-compose.prod.yml build`
   - **Start Command**: `docker-compose -f docker-compose.prod.yml up`
5. **Set Environment Variables** (same as Railway)
6. **Deploy**

### Option 3: DigitalOcean App Platform

1. **Sign up** at [DigitalOcean](https://digitalocean.com)
2. **Create App** from your GitHub repository
3. **Configure** environment variables
4. **Deploy**

### Option 4: Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```
3. **Set environment variables**:
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
   heroku config:set OPENAI_API_KEY=your-key
   ```
4. **Deploy**:
   ```bash
   git push heroku main
   ```

## Environment Variables

### Required
- `JWT_SECRET`: Secret key for JWT token signing
- `CORS_ORIGIN`: Allowed origins for CORS (comma-separated)
- `REACT_APP_API_URL`: Frontend API URL

### Optional
- `OPENAI_API_KEY`: OpenAI API key for AI comments
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `DB_PATH`: Database file path
- `UPLOAD_PATH`: File upload directory
- `MAX_FILE_SIZE`: Maximum file size in bytes
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Confessions
- `GET /api/confessions` - Get confessions feed
- `POST /api/confessions` - Create new confession
- `GET /api/confessions/:id` - Get specific confession
- `PUT /api/confessions/:id` - Update confession
- `DELETE /api/confessions/:id` - Delete confession
- `POST /api/confessions/:id/vote` - Vote on confession

### Comments
- `GET /api/comments/confession/:id` - Get comments for confession
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/vote` - Vote on comment

### Moderation
- `POST /api/confessions/:id/flag` - Flag confession
- `GET /api/moderation/flags` - Get flagged content
- `POST /api/moderation/delete/:type/:id` - Delete content
- `POST /api/moderation/suspend/:userId` - Suspend user

### Data Export
- `GET /api/user/export` - Export user data

## User Roles & Permissions

- **Standard User**: Create confessions, vote, comment
- **Moderator** (100+ karma): Flag content, delete posts
- **Admin**: Full moderation access, suspend users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team. 