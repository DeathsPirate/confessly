# 🚀 Confessly Deployment Guide

This guide will help you deploy Confessly to various cloud platforms.

## Quick Deploy Options

### 🎯 **Railway (Recommended - Easiest)**

1. **Fork this repository** to your GitHub account
2. **Sign up** at [Railway](https://railway.app)
3. **Connect your GitHub repository**
4. **Set Environment Variables**:
   ```
   JWT_SECRET=your-super-secure-jwt-secret-key
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.railway.app
   REACT_APP_API_URL=https://your-app.railway.app/api
   OPENAI_API_KEY=your-openai-api-key (optional)
   ```
5. **Deploy** - Railway will automatically build and deploy!

### 🌐 **Render (Free Tier Available)**

1. **Sign up** at [Render](https://render.com)
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Build Command**: `docker-compose -f docker-compose.prod.yml build`
   - **Start Command**: `docker-compose -f docker-compose.prod.yml up`
5. **Set Environment Variables** (same as Railway)
6. **Deploy**

### ⚡ **Heroku (Classic Choice)**

1. **Install Heroku CLI**
2. **Create app**: `heroku create your-app-name`
3. **Set environment variables**:
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
   heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com/api
   heroku config:set OPENAI_API_KEY=your-key
   ```
4. **Deploy**: `git push heroku main`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secure-jwt-secret-key` |
| `CORS_ORIGIN` | Allowed origins for CORS | `https://your-domain.com` |
| `REACT_APP_API_URL` | Frontend API URL | `https://your-domain.com/api` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI comments | `sk-your-openai-key` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `DB_PATH` | Database file path | `/app/data/confessly.db` |
| `UPLOAD_PATH` | File upload directory | `/app/uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | `5242880` |

## Generating Secure JWT Secret

Generate a secure JWT secret using one of these methods:

### Using OpenSSL (Linux/Mac)
```bash
openssl rand -base64 32
```

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Using PowerShell (Windows)
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Platform-Specific Instructions

### Railway Deployment

1. **Fork the repository** to your GitHub account
2. **Go to [Railway](https://railway.app)** and sign up
3. **Click "New Project"** → "Deploy from GitHub repo"
4. **Select your forked repository**
5. **Set environment variables** in the Railway dashboard:
   ```
   JWT_SECRET=your-generated-secret
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.railway.app
   REACT_APP_API_URL=https://your-app.railway.app/api
   OPENAI_API_KEY=your-openai-key (optional)
   ```
6. **Deploy** - Railway will automatically build and deploy!

### Render Deployment

1. **Go to [Render](https://render.com)** and sign up
2. **Click "New"** → "Web Service"
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `confessly`
   - **Environment**: `Docker`
   - **Build Command**: `docker-compose -f docker-compose.prod.yml build`
   - **Start Command**: `docker-compose -f docker-compose.prod.yml up`
5. **Set environment variables** in the Render dashboard
6. **Deploy**

### Heroku Deployment

1. **Install Heroku CLI** from [Heroku Dev Center](https://devcenter.heroku.com/articles/heroku-cli)
2. **Login to Heroku**:
   ```bash
   heroku login
   ```
3. **Create a new Heroku app**:
   ```bash
   heroku create your-app-name
   ```
4. **Set environment variables**:
   ```bash
   heroku config:set JWT_SECRET=your-generated-secret
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
   heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com/api
   heroku config:set OPENAI_API_KEY=your-openai-key
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```

## Post-Deployment

### Verify Deployment

1. **Check your app URL** - it should be accessible
2. **Test the health endpoint**: `https://your-domain.com/api/health`
3. **Register a new user** and test the application
4. **Create a confession** to test the AI functionality

### Custom Domain (Optional)

Most platforms allow you to add a custom domain:

- **Railway**: Settings → Domains → Add Domain
- **Render**: Settings → Custom Domains → Add Domain
- **Heroku**: Settings → Domains → Add Domain

Remember to update your `CORS_ORIGIN` environment variable when adding a custom domain.

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all environment variables are set
2. **CORS errors**: Ensure `CORS_ORIGIN` matches your domain exactly
3. **Database errors**: The SQLite database will be created automatically
4. **AI not working**: Check that `OPENAI_API_KEY` is set correctly

### Getting Help

- Check the platform's logs for error messages
- Verify all environment variables are set correctly
- Test locally first to ensure the app works
- Open an issue on GitHub if you need help

## Security Considerations

1. **Use strong JWT secrets** - generate them securely
2. **Keep API keys private** - never commit them to version control
3. **Use HTTPS** - all platforms provide this by default
4. **Regular updates** - keep dependencies updated
5. **Monitor usage** - especially for paid services

## Cost Considerations

- **Railway**: Free tier available, then pay-as-you-go
- **Render**: Free tier available, then $7/month
- **Heroku**: Requires credit card, $7/month minimum
- **OpenAI**: Pay-per-use, very affordable for small apps

---

🎉 **Congratulations!** Your Confessly app is now live on the internet! 