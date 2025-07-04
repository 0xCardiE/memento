#!/bin/bash

# =================================
# Hardhat 3 Configuration Variables
# =================================
# Copy this file and modify with your actual values
# Usage: source scripts/env-vars-example.sh

echo "🔧 Setting up Hardhat 3 configuration variables..."

# Required for Sepolia deployment
export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"

# Optional: Mainnet deployment
# export HARDHAT_VAR_MAINNET_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"  
# export HARDHAT_VAR_MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"

# Optional: Other networks
# export HARDHAT_VAR_POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
# export HARDHAT_VAR_ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
# export HARDHAT_VAR_OPTIMISM_RPC_URL="https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"

# Optional: Contract verification API keys
# export HARDHAT_VAR_ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
# export HARDHAT_VAR_POLYGONSCAN_API_KEY="YOUR_POLYGONSCAN_API_KEY"
# export HARDHAT_VAR_ARBISCAN_API_KEY="YOUR_ARBISCAN_API_KEY"
# export HARDHAT_VAR_OPTIMISM_API_KEY="YOUR_OPTIMISM_API_KEY"

echo "✅ Environment variables set for current session"
echo ""
echo "📝 To make these permanent, add them to your ~/.zshrc or ~/.bashrc"
echo ""
echo "🔍 Check what's set with: npm run setup-hardhat"
echo "🧪 Test compilation with: npm run hardhat:compile"
echo "🚀 Deploy to Sepolia with: npx hardhat run scripts/deploy-memento.ts --network sepolia" 