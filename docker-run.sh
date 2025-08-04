#!/bin/bash

# Confessly Docker Runner Script

echo "🤖 Confessly - Anonymous Confession Social App"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod|stop|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start the application in development mode (default)"
    echo "  prod    - Start the application in production mode"
    echo "  stop    - Stop all running containers"
    echo "  clean   - Stop containers and remove volumes"
    echo ""
    echo "Examples:"
    echo "  $0        # Start in development mode"
    echo "  $0 dev    # Start in development mode"
    echo "  $0 prod   # Start in production mode"
    echo "  $0 stop   # Stop containers"
    echo "  $0 clean  # Clean up everything"
}

# Function to start development mode
start_dev() {
    echo "🚀 Starting Confessly in development mode..."
    echo ""
    echo "📝 Note: For AI comments to work, set your OPENAI_API_KEY environment variable:"
    echo "   export OPENAI_API_KEY=your-openai-api-key-here"
    echo ""
    
    docker-compose up --build
}

# Function to start production mode
start_prod() {
    echo "🚀 Starting Confessly in production mode..."
    echo ""
    echo "⚠️  Make sure to set the following environment variables:"
    echo "   export JWT_SECRET=your-secure-jwt-secret"
    echo "   export OPENAI_API_KEY=your-openai-api-key-here (optional)"
    echo "   export CORS_ORIGIN=your-frontend-url (optional)"
    echo ""
    
    docker-compose -f docker-compose.prod.yml up --build -d
    echo "✅ Application started in production mode!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
}

# Function to stop containers
stop_containers() {
    echo "🛑 Stopping Confessly containers..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Containers stopped!"
}

# Function to clean up
clean_up() {
    echo "🧹 Cleaning up Confessly containers and volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    echo "✅ Cleanup completed!"
}

# Main script logic
case "${1:-dev}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_containers
        ;;
    "clean")
        clean_up
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_usage
        exit 1
        ;;
esac 