@echo off
setlocal enabledelayedexpansion

echo 🚀 Confessly Deployment Script
echo ==============================

REM Check if platform is specified
if "%1"=="" (
    echo ❌ Please specify a deployment platform
    echo.
    echo Usage: deploy.bat [PLATFORM]
    echo.
    echo Platforms:
    echo   railway    Deploy to Railway
    echo   render     Show Render deployment instructions
    echo   heroku     Deploy to Heroku
    echo.
    echo Examples:
    echo   deploy.bat railway
    echo   deploy.bat render
    echo   deploy.bat heroku
    exit /b 1
)

set PLATFORM=%1

if "%PLATFORM%"=="railway" goto :deploy_railway
if "%PLATFORM%"=="render" goto :deploy_render
if "%PLATFORM%"=="heroku" goto :deploy_heroku

echo ❌ Unknown platform: %PLATFORM%
echo Supported platforms: railway, render, heroku
exit /b 1

:deploy_railway
echo 📦 Deploying to Railway...
echo.
echo ⚠️  Please deploy manually through Railway:
echo 1. Go to https://railway.app
echo 2. Sign up and connect your GitHub repository
echo 3. Set environment variables:
echo    - JWT_SECRET: [generate a secure random string]
echo    - NODE_ENV: production
echo    - CORS_ORIGIN: your-railway-url
echo    - REACT_APP_API_URL: your-railway-url/api
echo    - OPENAI_API_KEY: [your OpenAI API key]
echo 4. Deploy automatically from GitHub
echo.
echo ✅ Railway will automatically build and deploy your app!
goto :end

:deploy_render
echo 📦 Deploying to Render...
echo.
echo ⚠️  Please deploy manually through Render:
echo 1. Go to https://render.com
echo 2. Create a new Web Service
echo 3. Connect your GitHub repository
echo 4. Set environment variables:
echo    - JWT_SECRET: [generate a secure random string]
echo    - NODE_ENV: production
echo    - CORS_ORIGIN: your-render-url
echo    - REACT_APP_API_URL: your-render-url/api
echo    - OPENAI_API_KEY: [your OpenAI API key]
echo 5. Build Command: docker-compose -f docker-compose.prod.yml build
echo 6. Start Command: docker-compose -f docker-compose.prod.yml up
echo.
echo ✅ Render will build and deploy your app!
goto :end

:deploy_heroku
echo 📦 Deploying to Heroku...
echo.
echo ⚠️  Please deploy manually through Heroku:
echo 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
echo 2. Create Heroku app: heroku create your-app-name
echo 3. Set environment variables:
echo    heroku config:set JWT_SECRET=[your-secret]
echo    heroku config:set NODE_ENV=production
echo    heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
echo    heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com/api
echo    heroku config:set OPENAI_API_KEY=[your-key]
echo 4. Deploy: git push heroku main
echo.
echo ✅ Heroku will build and deploy your app!
goto :end

:end
echo.
echo 🎉 Deployment instructions complete!
echo Check the README.md for more detailed instructions.
pause 