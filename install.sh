#!/bin/bash

echo "🚀 Installing NLU Chatbot with HuggingFace Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Create uploads directory
echo "📁 Creating uploads directory..."
cd ../backend
mkdir -p uploads

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your HuggingFace API key in backend/.env"
echo "2. Run backend: cd backend && npm run dev"
echo "3. Run frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:5173"
echo ""
echo "🎉 Happy coding!"
