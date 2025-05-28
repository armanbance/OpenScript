#!/bin/bash

echo "🎬 Setting up OpenScript..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cp env.example .env.local
    echo "⚠️  Please add your API keys to .env.local before running the app"
else
    echo "✅ Environment file already exists"
fi

# Create necessary directories
mkdir -p public/images
mkdir -p lib/types

echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your API keys to .env.local:"
echo "   - GROQ_API_KEY (for transcription)"
echo "   - FRIENDLI_API_KEY (for script generation)"
echo "   - SUPABASE_URL and SUPABASE_ANON_KEY (optional)"
echo ""
echo "2. Run the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy scripting! 🎥✨" 