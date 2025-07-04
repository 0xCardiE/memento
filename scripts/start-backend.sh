#!/bin/bash

# Start Backend Services for Memento AI Generator with PM2
echo "🚀 Starting Memento Backend Services with PM2..."

# Check if we're in the right directory
if [ ! -f "backend/index.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found"
    echo "Please create backend/.env with the following variables:"
    echo "ADMIN_PRIVATE_KEY=your-admin-private-key-here"
    echo "CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3"
    echo "RPC_URL=http://127.0.0.1:8545"
    echo "OPENAI_API_KEY=your-openai-api-key-here"
    echo "SWARM_GATEWAY=http://localhost:5555"
    exit 1
fi

# Change to backend directory
cd backend

# Stop any existing processes
echo "🛑 Stopping any existing processes..."
pm2 stop memento-ai-generator 2>/dev/null || true
pm2 stop memento-swarm-gateway 2>/dev/null || true

# Start SWARM gateway if index.js exists
if [ -f "index.js" ]; then
    echo "🐝 Starting SWARM gateway with PM2..."
    pm2 start index.js --name memento-swarm-gateway
    echo "SWARM gateway started with PM2"
fi

# Wait a moment for SWARM to start
sleep 3

# Start AI generator service
echo "🎨 Starting AI generator service with PM2..."
pm2 start index.js --name memento-ai-generator

# Save PM2 configuration
pm2 save

echo "✅ All services started successfully with PM2!"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "🔍 Useful PM2 Commands:"
echo "  pm2 logs memento-ai-generator  # View logs"
echo "  pm2 monit                      # Real-time monitoring"
echo "  pm2 restart memento-ai-generator  # Restart service"
echo "  pm2 stop memento-ai-generator  # Stop service"
echo ""
echo "📡 SWARM Gateway: http://localhost:5555"
echo "🎨 AI Generator: Listening for contract events"
echo ""
echo "Press Ctrl+C to exit this script (services will keep running)"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "ℹ️  Services are still running in the background"
    echo "Use 'pm2 stop all' to stop all services"
    echo "Use 'pm2 status' to check service status"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running to show live logs
echo "📜 Showing live logs (Ctrl+C to exit):"
pm2 logs memento-ai-generator --lines 20 