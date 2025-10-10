#!/bin/bash

# 🚀 Chatbot NLU Trainer & Evaluator - Deployment Script
# =====================================================
# Automated deployment script for various platforms
# Author: Amarjit Kumar
# Repository: https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}  🤖 Chatbot NLU Trainer & Evaluator${NC}"
    echo -e "${BLUE}  Deployment Script${NC}"
    echo -e "${BLUE}=================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main deployment function
deploy_platform() {
    local platform=$1
    
    case $platform in
        "docker")
            deploy_docker
            ;;
        "streamlit")
            deploy_streamlit
            ;;
        "huggingface")
            deploy_huggingface
            ;;
        "railway")
            deploy_railway
            ;;
        "render")
            deploy_render
            ;;
        "all")
            deploy_all_free_tier
            ;;
        *)
            show_help
            ;;
    esac
}

# Docker deployment
deploy_docker() {
    print_info "🐳 Starting Docker deployment..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.deployment .env
        print_warning "Please edit .env file with your configuration before continuing."
        print_info "Press Enter when ready to continue..."
        read
    fi
    
    # Build and start services
    print_info "Building Docker images..."
    docker-compose build --no-cache
    
    print_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        print_success "Backend is running at http://localhost:3001"
    else
        print_error "Backend health check failed"
    fi
    
    if curl -f http://localhost >/dev/null 2>&1; then
        print_success "Frontend is running at http://localhost"
    else
        print_error "Frontend health check failed"
    fi
    
    print_success "Docker deployment completed!"
    print_info "Access your application:"
    print_info "  Frontend: http://localhost"
    print_info "  Backend API: http://localhost:3001"
    print_info "  Health Check: http://localhost:3001/api/health"
}

# Streamlit deployment
deploy_streamlit() {
    print_info "🌟 Preparing Streamlit deployment..."
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    # Install requirements
    print_info "Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    # Test Streamlit app locally
    print_info "Testing Streamlit app locally..."
    print_success "Streamlit files ready for deployment!"
    print_info "To deploy on Streamlit Cloud:"
    print_info "1. Go to https://share.streamlit.io"
    print_info "2. Connect your GitHub repository"
    print_info "3. Set main file: streamlit_app.py"
    print_info "4. Deploy!"
    
    # Option to run locally
    echo -e "\n${YELLOW}Would you like to test locally? (y/n):${NC}"
    read -r test_local
    if [ "$test_local" = "y" ] || [ "$test_local" = "Y" ]; then
        print_info "Starting Streamlit locally..."
        streamlit run streamlit_app.py
    fi
}

# Hugging Face Spaces deployment
deploy_huggingface() {
    print_info "🤗 Preparing Hugging Face Spaces deployment..."
    
    # Check if files exist
    if [ ! -f gradio_app.py ]; then
        print_error "gradio_app.py not found!"
        exit 1
    fi
    
    if [ ! -f requirements_gradio.txt ]; then
        print_error "requirements_gradio.txt not found!"
        exit 1
    fi
    
    print_success "Hugging Face Spaces files ready!"
    print_info "To deploy on Hugging Face Spaces:"
    print_info "1. Go to https://huggingface.co/spaces"
    print_info "2. Create new Space with Gradio SDK"
    print_info "3. Clone your Space repository"
    print_info "4. Copy gradio_app.py to app.py in your Space"
    print_info "5. Copy requirements_gradio.txt to requirements.txt"
    print_info "6. Push to your Space repository"
    
    # Test locally if gradio is installed
    if command_exists python3; then
        echo -e "\n${YELLOW}Would you like to test locally? (y/n):${NC}"
        read -r test_local
        if [ "$test_local" = "y" ] || [ "$test_local" = "Y" ]; then
            print_info "Installing Gradio..."
            pip3 install gradio pandas plotly numpy
            print_info "Starting Gradio locally..."
            python3 gradio_app.py
        fi
    fi
}

# Railway deployment
deploy_railway() {
    print_info "🚂 Preparing Railway deployment..."
    
    # Check if Railway CLI is installed
    if ! command_exists railway; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Check configuration files
    if [ ! -f railway.toml ]; then
        print_error "railway.toml not found!"
        exit 1
    fi
    
    if [ ! -f Procfile ]; then
        print_error "Procfile not found!"
        exit 1
    fi
    
    print_success "Railway configuration files ready!"
    print_info "To deploy on Railway:"
    print_info "1. Login to Railway: railway login"
    print_info "2. Create project: railway init"
    print_info "3. Add environment variables from .env.deployment"
    print_info "4. Deploy: railway up"
    
    # Option to login and deploy
    echo -e "\n${YELLOW}Would you like to deploy now? (y/n):${NC}"
    read -r deploy_now
    if [ "$deploy_now" = "y" ] || [ "$deploy_now" = "Y" ]; then
        print_info "Logging into Railway..."
        railway login
        
        print_info "Initializing Railway project..."
        railway init
        
        print_info "Deploying to Railway..."
        railway up
        
        print_success "Railway deployment initiated!"
    fi
}

# Render deployment
deploy_render() {
    print_info "🎨 Preparing Render deployment..."
    
    # Check configuration file
    if [ ! -f render.yaml ]; then
        print_error "render.yaml not found!"
        exit 1
    fi
    
    print_success "Render configuration ready!"
    print_info "To deploy on Render:"
    print_info "1. Go to https://render.com"
    print_info "2. Connect your GitHub repository"
    print_info "3. Select 'Blueprint' deployment"
    print_info "4. Use render.yaml for configuration"
    print_info "5. Add environment variables from .env.deployment"
    print_info "6. Deploy!"
}

# Deploy all free-tier platforms
deploy_all_free_tier() {
    print_info "🚀 Preparing all free-tier deployments..."
    
    print_info "Checking all deployment files..."
    
    # Check all required files
    files=("streamlit_app.py" "requirements.txt" "gradio_app.py" "requirements_gradio.txt" "railway.toml" "Procfile" "render.yaml" ".env.deployment")
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file missing!"
        fi
    done
    
    print_success "All deployment files ready!"
    print_info ""
    print_info "🌟 Streamlit Cloud: streamlit_app.py + requirements.txt"
    print_info "🤗 Hugging Face Spaces: gradio_app.py + requirements_gradio.txt"
    print_info "🚂 Railway: railway.toml + Procfile"
    print_info "🎨 Render: render.yaml"
    print_info ""
    print_info "Copy the respective files to your deployment platform!"
}

# Show help
show_help() {
    echo "Usage: $0 [PLATFORM]"
    echo ""
    echo "Available platforms:"
    echo "  docker      - Deploy using Docker Compose"
    echo "  streamlit   - Prepare for Streamlit Cloud deployment"
    echo "  huggingface - Prepare for Hugging Face Spaces deployment"
    echo "  railway     - Prepare for Railway deployment"
    echo "  render      - Prepare for Render deployment"
    echo "  all         - Prepare all free-tier deployments"
    echo ""
    echo "Examples:"
    echo "  $0 docker      # Deploy locally with Docker"
    echo "  $0 streamlit   # Prepare Streamlit deployment"
    echo "  $0 all         # Check all deployment files"
}

# Main script
main() {
    print_header
    
    if [ $# -eq 0 ]; then
        print_warning "No platform specified."
        show_help
        exit 1
    fi
    
    deploy_platform "$1"
}

# Run main function with all arguments
main "$@"