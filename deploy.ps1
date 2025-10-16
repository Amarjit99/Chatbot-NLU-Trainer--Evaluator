# 🚀 Chatbot NLU Trainer & Evaluator - Windows Deployment Script
# ==============================================================
# PowerShell deployment script for Windows users
# Author: Amarjit Kumar
# Repository: https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator

param(
    [Parameter(Position=0)]
    [string]$Platform = ""
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green" 
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-Header {
    Write-Host "=================================================" -ForegroundColor $Colors.Blue
    Write-Host "  🤖 Chatbot NLU Trainer & Evaluator" -ForegroundColor $Colors.Blue
    Write-Host "  Windows Deployment Script" -ForegroundColor $Colors.Blue
    Write-Host "=================================================" -ForegroundColor $Colors.Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Deploy-Docker {
    Write-Info "🐳 Starting Docker deployment..."
    
    if (-not (Test-Command "docker")) {
        Write-Error-Custom "Docker is not installed. Please install Docker Desktop first."
        Write-Info "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    if (-not (Test-Command "docker-compose")) {
        Write-Error-Custom "Docker Compose is not available. Please ensure Docker Desktop is running."
        exit 1
    }
    
    # Check if .env exists
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating from template..."
        Copy-Item ".env.deployment" ".env"
        Write-Warning "Please edit .env file with your configuration before continuing."
        Write-Info "Press Enter when ready to continue..."
        Read-Host
    }
    
    # Build and start services
    Write-Info "Building Docker images..."
    docker-compose build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Docker build failed!"
        exit 1
    }
    
    Write-Info "Starting services..."
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to start services!"
        exit 1
    }
    
    # Wait for services to be ready
    Write-Info "Waiting for services to start..."
    Start-Sleep -Seconds 10
    
    # Check health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
        Write-Success "Backend is running at http://localhost:3001"
    }
    catch {
        Write-Error-Custom "Backend health check failed"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5
        Write-Success "Frontend is running at http://localhost"
    }
    catch {
        Write-Error-Custom "Frontend health check failed"
    }
    
    Write-Success "Docker deployment completed!"
    Write-Info "Access your application:"
    Write-Info "  Frontend: http://localhost"
    Write-Info "  Backend API: http://localhost:3001"
    Write-Info "  Health Check: http://localhost:3001/api/health"
}

function Deploy-Streamlit {
    Write-Info "🌟 Preparing Streamlit deployment..."
    
    if (-not (Test-Command "python")) {
        Write-Error-Custom "Python is not installed. Please install Python 3.8+ first."
        Write-Info "Download from: https://www.python.org/downloads/"
        exit 1
    }
    
    # Check if streamlit_app.py exists
    if (-not (Test-Path "streamlit_app.py")) {
        Write-Error-Custom "streamlit_app.py not found!"
        exit 1
    }
    
    if (-not (Test-Path "requirements.txt")) {
        Write-Error-Custom "requirements.txt not found!"
        exit 1
    }
    
    # Install requirements
    Write-Info "Installing Python dependencies..."
    try {
        pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            throw "pip install failed"
        }
    }
    catch {
        Write-Error-Custom "Failed to install requirements. Make sure pip is available."
        exit 1
    }
    
    Write-Success "Streamlit files ready for deployment!"
    Write-Info "To deploy on Streamlit Cloud:"
    Write-Info "1. Go to https://share.streamlit.io"
    Write-Info "2. Connect your GitHub repository"
    Write-Info "3. Set main file: streamlit_app.py"
    Write-Info "4. Deploy!"
    
    # Option to run locally
    $testLocal = Read-Host "`nWould you like to test locally? (y/n)"
    if ($testLocal -eq "y" -or $testLocal -eq "Y") {
        Write-Info "Starting Streamlit locally..."
        streamlit run streamlit_app.py
    }
}

function Deploy-HuggingFace {
    Write-Info "🤗 Preparing Hugging Face Spaces deployment..."
    
    # Check if files exist
    if (-not (Test-Path "gradio_app.py")) {
        Write-Error-Custom "gradio_app.py not found!"
        exit 1
    }
    
    if (-not (Test-Path "requirements_gradio.txt")) {
        Write-Error-Custom "requirements_gradio.txt not found!"
        exit 1
    }
    
    Write-Success "Hugging Face Spaces files ready!"
    Write-Info "To deploy on Hugging Face Spaces:"
    Write-Info "1. Go to https://huggingface.co/spaces"
    Write-Info "2. Create new Space with Gradio SDK"
    Write-Info "3. Clone your Space repository"
    Write-Info "4. Copy gradio_app.py to app.py in your Space"
    Write-Info "5. Copy requirements_gradio.txt to requirements.txt"
    Write-Info "6. Push to your Space repository"
    
    # Test locally if python is available
    if (Test-Command "python") {
        $testLocal = Read-Host "`nWould you like to test locally? (y/n)"
        if ($testLocal -eq "y" -or $testLocal -eq "Y") {
            Write-Info "Installing Gradio..."
            pip install gradio pandas plotly numpy
            Write-Info "Starting Gradio locally..."
            python gradio_app.py
        }
    }
}

function Deploy-Railway {
    Write-Info "🚂 Preparing Railway deployment..."
    
    # Check if Railway CLI is installed
    if (-not (Test-Command "railway")) {
        Write-Warning "Railway CLI not found. Installing via npm..."
        if (Test-Command "npm") {
            npm install -g @railway/cli
        } else {
            Write-Error-Custom "npm not found. Please install Node.js first."
            Write-Info "Download from: https://nodejs.org/"
            exit 1
        }
    }
    
    # Check configuration files
    if (-not (Test-Path "railway.toml")) {
        Write-Error-Custom "railway.toml not found!"
        exit 1
    }
    
    if (-not (Test-Path "Procfile")) {
        Write-Error-Custom "Procfile not found!"
        exit 1
    }
    
    Write-Success "Railway configuration files ready!"
    Write-Info "To deploy on Railway:"
    Write-Info "1. Login to Railway: railway login"
    Write-Info "2. Create project: railway init"
    Write-Info "3. Add environment variables from .env.deployment"
    Write-Info "4. Deploy: railway up"
    
    # Option to login and deploy
    $deployNow = Read-Host "`nWould you like to deploy now? (y/n)"
    if ($deployNow -eq "y" -or $deployNow -eq "Y") {
        Write-Info "Logging into Railway..."
        railway login
        
        Write-Info "Initializing Railway project..."
        railway init
        
        Write-Info "Deploying to Railway..."
        railway up
        
        Write-Success "Railway deployment initiated!"
    }
}

function Deploy-Render {
    Write-Info "🎨 Preparing Render deployment..."
    
    # Check configuration file
    if (-not (Test-Path "render.yaml")) {
        Write-Error-Custom "render.yaml not found!"
        exit 1
    }
    
    Write-Success "Render configuration ready!"
    Write-Info "To deploy on Render:"
    Write-Info "1. Go to https://render.com"
    Write-Info "2. Connect your GitHub repository"
    Write-Info "3. Select 'Blueprint' deployment"
    Write-Info "4. Use render.yaml for configuration"
    Write-Info "5. Add environment variables from .env.deployment"
    Write-Info "6. Deploy!"
}

function Deploy-All {
    Write-Info "🚀 Checking all free-tier deployment files..."
    
    $files = @(
        "streamlit_app.py",
        "requirements.txt", 
        "gradio_app.py",
        "requirements_gradio.txt",
        "railway.toml",
        "Procfile",
        "render.yaml",
        ".env.deployment"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file exists"
        } else {
            Write-Error-Custom "$file missing!"
        }
    }
    
    Write-Success "All deployment files ready!"
    Write-Info ""
    Write-Info "🌟 Streamlit Cloud: streamlit_app.py + requirements.txt"
    Write-Info "🤗 Hugging Face Spaces: gradio_app.py + requirements_gradio.txt"
    Write-Info "🚂 Railway: railway.toml + Procfile"
    Write-Info "🎨 Render: render.yaml"
    Write-Info ""
    Write-Info "Copy the respective files to your deployment platform!"
}

function Show-Help {
    Write-Host "Usage: .\deploy.ps1 [PLATFORM]" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Available platforms:" -ForegroundColor $Colors.Cyan
    Write-Host "  docker      - Deploy using Docker Compose"
    Write-Host "  streamlit   - Prepare for Streamlit Cloud deployment"
    Write-Host "  huggingface - Prepare for Hugging Face Spaces deployment"
    Write-Host "  railway     - Prepare for Railway deployment"
    Write-Host "  render      - Prepare for Render deployment"
    Write-Host "  all         - Check all deployment files"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.Cyan
    Write-Host "  .\deploy.ps1 docker      # Deploy locally with Docker"
    Write-Host "  .\deploy.ps1 streamlit   # Prepare Streamlit deployment"
    Write-Host "  .\deploy.ps1 all         # Check all deployment files"
}

# Main script execution
function Main {
    Write-Header
    
    if (-not $Platform) {
        Write-Warning "No platform specified."
        Show-Help
        exit 1
    }
    
    switch ($Platform.ToLower()) {
        "docker" { Deploy-Docker }
        "streamlit" { Deploy-Streamlit }
        "huggingface" { Deploy-HuggingFace }
        "railway" { Deploy-Railway }
        "render" { Deploy-Render }
        "all" { Deploy-All }
        default { 
            Write-Error-Custom "Unknown platform: $Platform"
            Show-Help
            exit 1
        }
    }
}

# Run the main function
Main