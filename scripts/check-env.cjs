#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_ENV_VARS = {
  // Hardhat required variables
  SEPOLIA_PRIVATE_KEY: 'Private key for Sepolia testnet deployment',
  SEPOLIA_RPC_URL: 'RPC URL for Sepolia testnet',
  
  // Next.js required variables
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'WalletConnect Project ID from https://cloud.walletconnect.com',
  NEXT_PUBLIC_APP_NAME: 'Application name',
  NEXT_PUBLIC_DEFAULT_CHAIN: 'Default blockchain network',
};

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = {
  // Additional networks
  MAINNET_PRIVATE_KEY: 'Private key for mainnet deployment',
  MAINNET_RPC_URL: 'RPC URL for mainnet',
  POLYGON_RPC_URL: 'RPC URL for Polygon network',
  ARBITRUM_RPC_URL: 'RPC URL for Arbitrum network',
  OPTIMISM_RPC_URL: 'RPC URL for Optimism network',
  
  // API keys
  ALCHEMY_API_KEY: 'Alchemy API key',
  ETHERSCAN_API_KEY: 'Etherscan API key for contract verification',
  
  // Contract addresses
  NEXT_PUBLIC_MEMENTO_CONTRACT_SEPOLIA: 'Mement Machina - Vol 1 contract address on Sepolia',
  NEXT_PUBLIC_MEMENTO_CONTRACT_MAINNET: 'Mement Machina - Vol 1 contract address on Mainnet',
};

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Missing .env file!');
    console.log('   Run: cp .env.example .env');
    console.log('   Then fill in your actual values\n');
    hasErrors = true;
  } else {
    console.log('✅ Found .env file\n');
  }
  
  // Check required variables
  console.log('📋 Required Environment Variables:');
  for (const [varName, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];
    if (!value || value === 'your_value_here' || value.includes('YOUR_') || value.includes('your_')) {
      console.log(`❌ ${varName}: Missing or using placeholder value`);
      console.log(`   Description: ${description}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  }
  
  console.log('\n📋 Recommended Environment Variables:');
  for (const [varName, description] of Object.entries(RECOMMENDED_ENV_VARS)) {
    const value = process.env[varName];
    if (!value || value === 'your_value_here' || value.includes('YOUR_') || value.includes('your_')) {
      console.log(`⚠️  ${varName}: Missing or using placeholder value`);
      console.log(`   Description: ${description}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  if (hasErrors) {
    console.log('❌ Some required environment variables are missing!');
    console.log('   Please update your .env file with real values before deploying.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  All required variables are set, but some recommended ones are missing.');
    console.log('   Consider adding them for full functionality.');
  } else {
    console.log('✅ All environment variables are properly configured!');
  }
  
  console.log('\n🔗 Useful Links:');
  console.log('   • Alchemy: https://www.alchemy.com/');
  console.log('   • Infura: https://infura.io/');
  console.log('   • WalletConnect: https://cloud.walletconnect.com/');
  console.log('   • Etherscan API: https://etherscan.io/apis');
}

// Load environment variables
require('dotenv').config();

// Run the check
checkEnvironmentVariables(); 