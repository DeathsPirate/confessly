@echo off
setlocal enabledelayedexpansion

echo 🤖 Confessly - Anonymous Confession Social App
echo ==============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install it and try again.
    pause
    exit /b 1
)

REM Get the command from arguments
set "command=%1"
if "%command%"=="" set "command=dev"

REM Main script logic
if "%command%"=="dev" (
    echo 🚀 Starting Confessly in development mode...
    echo.
    echo 📝 Note: For AI comments to work, set your OPENAI_API_KEY environment variable:
    echo    set OPENAI_API_KEY=your-openai-api-key-here
    echo.
    docker-compose up --build
) else if "%command%"=="prod" (
    echo 🚀 Starting Confessly in production mode...
    echo.
    echo ⚠️  Make sure to set the following environment variables:
    echo    set JWT_SECRET=your-secure-jwt-secret
    echo    set OPENAI_API_KEY=your-openai-api-key-here ^(optional^)
    echo    set CORS_ORIGIN=your-frontend-url ^(optional^)
    echo.
    docker-compose -f docker-compose.prod.yml up --build -d
    echo ✅ Application started in production mode!
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:5000
    pause
) else if "%command%"=="stop" (
    echo 🛑 Stopping Confessly containers...
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    echo ✅ Containers stopped!
    pause
) else if "%command%"=="clean" (
    echo 🧹 Cleaning up Confessly containers and volumes...
    docker-compose down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    echo ✅ Cleanup completed!
    pause
) else if "%command%"=="help" (
    echo Usage: %0 [dev^|prod^|stop^|clean]
    echo.
    echo Commands:
    echo   dev     - Start the application in development mode ^(default^)
    echo   prod    - Start the application in production mode
    echo   stop    - Stop all running containers
    echo   clean   - Stop containers and remove volumes
    echo.
    echo Examples:
    echo   %0        # Start in development mode
    echo   %0 dev    # Start in development mode
    echo   %0 prod   # Start in production mode
    echo   %0 stop   # Stop containers
    echo   %0 clean  # Clean up everything
    pause
) else (
    echo ❌ Unknown command: %command%
    echo.
    echo Usage: %0 [dev^|prod^|stop^|clean]
    echo Run '%0 help' for more information.
    pause
    exit /b 1
) 