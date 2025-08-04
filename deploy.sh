#!/bin/bash

# Confessly Deployment Script
# This script helps deploy the application to various platforms

set -e

echo "🚀 Confessly Deployment Script"
echo "=============================="

# Function to generate secure JWT secret
generate_jwt_secret() {
    openssl rand -base64 32
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Railway
deploy_railway() {
    echo "📦 Deploying to Railway..."
    
    if ! command_exists railway; then
        echo "❌ Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    # Generate JWT secret if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(generate_jwt_secret)
        echo "🔑 Generated JWT Secret: $JWT_SECRET"
    fi
    
    # Set environment variables
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set NODE_ENV=production
    railway variables set CORS_ORIGIN="https://$(railway domain)"
    railway variables set REACT_APP_API_URL="https://$(railway domain)/api"
    
    if [ -n "$OPENAI_API_KEY" ]; then
        railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
    fi
    
    # Deploy
    railway up
    echo "✅ Deployment complete!"
    echo "🌐 Your app is available at: https://$(railway domain)"
}

# Function to deploy to Render
deploy_render() {
    echo "📦 Deploying to Render..."
    echo "⚠️  Please deploy manually through the Render dashboard:"
    echo "1. Go to https://render.com"
    echo "2. Create a new Web Service"
    echo "3. Connect your GitHub repository"
    echo "4. Set environment variables:"
    echo "   - JWT_SECRET: $(generate_jwt_secret)"
    echo "   - NODE_ENV: production"
    echo "   - CORS_ORIGIN: your-render-url"
    echo "   - REACT_APP_API_URL: your-render-url/api"
    echo "   - OPENAI_API_KEY: $OPENAI_API_KEY"
    echo "5. Build Command: docker-compose -f docker-compose.prod.yml build"
    echo "6. Start Command: docker-compose -f docker-compose.prod.yml up"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "📦 Deploying to Heroku..."
    
    if ! command_exists heroku; then
        echo "❌ Heroku CLI not found. Please install it first:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Generate JWT secret if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(generate_jwt_secret)
        echo "🔑 Generated JWT Secret: $JWT_SECRET"
    fi
    
    # Set environment variables
    heroku config:set JWT_SECRET="$JWT_SECRET"
    heroku config:set NODE_ENV=production
    heroku config:set CORS_ORIGIN="https://$(heroku info -s | grep web_url | cut -d= -f2)"
    heroku config:set REACT_APP_API_URL="https://$(heroku info -s | grep web_url | cut -d= -f2)/api"
    
    if [ -n "$OPENAI_API_KEY" ]; then
        heroku config:set OPENAI_API_KEY="$OPENAI_API_KEY"
    fi
    
    # Deploy
    git push heroku main
    echo "✅ Deployment complete!"
    echo "🌐 Your app is available at: https://$(heroku info -s | grep web_url | cut -d= -f2)"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS] PLATFORM"
    echo ""
    echo "Platforms:"
    echo "  railway    Deploy to Railway"
    echo "  render     Show Render deployment instructions"
    echo "  heroku     Deploy to Heroku"
    echo ""
    echo "Options:"
    echo "  -j, --jwt-secret SECRET    Use custom JWT secret"
    echo "  -o, --openai-key KEY       Set OpenAI API key"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  JWT_SECRET                 JWT secret for authentication"
    echo "  OPENAI_API_KEY            OpenAI API key for AI comments"
    echo ""
    echo "Examples:"
    echo "  $0 railway"
    echo "  $0 railway -o sk-your-openai-key"
    echo "  $0 heroku -j my-secret-key"
}

# Parse command line arguments
PLATFORM=""
JWT_SECRET=""
OPENAI_API_KEY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        railway|render|heroku)
            PLATFORM="$1"
            shift
            ;;
        -j|--jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        -o|--openai-key)
            OPENAI_API_KEY="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if platform is specified
if [ -z "$PLATFORM" ]; then
    echo "❌ Please specify a deployment platform"
    show_help
    exit 1
fi

# Deploy based on platform
case $PLATFORM in
    railway)
        deploy_railway
        ;;
    render)
        deploy_render
        ;;
    heroku)
        deploy_heroku
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        show_help
        exit 1
        ;;
esac 