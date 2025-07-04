#!/usr/bin/env node

/**
 * Hardhat Configuration Variables Setup Script
 * Helps users set up required Hardhat configuration variables for Hardhat 3 Alpha
 */

// Required Hardhat configuration variables (without HARDHAT_VAR_ prefix)
const HARDHAT_VARS = {
  SEPOLIA_PRIVATE_KEY: {
    description: 'Private key for Sepolia testnet deployment',
    required: true,
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  SEPOLIA_RPC_URL: {
    description: 'RPC URL for Sepolia testnet',
    required: true,
    example: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
  },
  MAINNET_PRIVATE_KEY: {
    description: 'Private key for mainnet deployment',
    required: false,
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  MAINNET_RPC_URL: {
    description: 'RPC URL for mainnet',
    required: false,
    example: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  },
  POLYGON_RPC_URL: {
    description: 'RPC URL for Polygon network',
    required: false,
    example: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  },
  ARBITRUM_RPC_URL: {
    description: 'RPC URL for Arbitrum network',
    required: false,
    example: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  },
  OPTIMISM_RPC_URL: {
    description: 'RPC URL for Optimism network',
    required: false,
    example: 'https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  },
  ETHERSCAN_API_KEY: {
    description: 'Etherscan API key for contract verification',
    required: false,
    example: 'YOUR_ETHERSCAN_API_KEY'
  },
  POLYGONSCAN_API_KEY: {
    description: 'Polygonscan API key for contract verification',
    required: false,
    example: 'YOUR_POLYGONSCAN_API_KEY'
  },
  ARBISCAN_API_KEY: {
    description: 'Arbiscan API key for contract verification',
    required: false,
    example: 'YOUR_ARBISCAN_API_KEY'
  },
  OPTIMISM_API_KEY: {
    description: 'Optimism API key for contract verification',
    required: false,
    example: 'YOUR_OPTIMISM_API_KEY'
  }
};

function checkHardhatVars() {
  console.log('🔧 Checking Hardhat Configuration Variables (HARDHAT_VAR_*)...\n');
  
  // Get list of existing HARDHAT_VAR_ environment variables
  const existingVars = [];
  const envVars = Object.keys(process.env);
  
  Object.keys(HARDHAT_VARS).forEach(varName => {
    const fullVarName = `HARDHAT_VAR_${varName}`;
    if (process.env[fullVarName]) {
      existingVars.push(varName);
    }
  });
  
  console.log('📋 Current Hardhat Variables:');
  if (existingVars.length === 0) {
    console.log('   None set yet');
  } else {
    existingVars.forEach(varName => {
      console.log(`   ✅ HARDHAT_VAR_${varName}`);
    });
  }
  
  console.log('\n📋 Required Variables:');
  const requiredVars = Object.entries(HARDHAT_VARS).filter(([_, config]) => config.required);
  let missingRequired = [];
  
  requiredVars.forEach(([varName, config]) => {
    if (existingVars.includes(varName)) {
      console.log(`   ✅ HARDHAT_VAR_${varName}: Set`);
    } else {
      console.log(`   ❌ HARDHAT_VAR_${varName}: Missing`);
      console.log(`      Description: ${config.description}`);
      console.log(`      Example: ${config.example}`);
      missingRequired.push(varName);
    }
  });
  
  console.log('\n📋 Optional Variables:');
  const optionalVars = Object.entries(HARDHAT_VARS).filter(([_, config]) => !config.required);
  let missingOptional = [];
  
  optionalVars.forEach(([varName, config]) => {
    if (existingVars.includes(varName)) {
      console.log(`   ✅ HARDHAT_VAR_${varName}: Set`);
    } else {
      console.log(`   ⚠️  HARDHAT_VAR_${varName}: Missing`);
      console.log(`      Description: ${config.description}`);
      console.log(`      Example: ${config.example}`);
      missingOptional.push(varName);
    }
  });
  
  console.log('\n📊 Summary:');
  if (missingRequired.length > 0) {
    console.log(`❌ Missing ${missingRequired.length} required variable(s)`);
    console.log('\n🔧 To set variables, run these commands:');
    missingRequired.forEach(varName => {
      const config = HARDHAT_VARS[varName];
      console.log(`   export HARDHAT_VAR_${varName}="${config.example}"`);
    });
    console.log('\n💡 For permanent setup, add these to your ~/.zshrc or ~/.bashrc');
  } else {
    console.log('✅ All required variables are set!');
  }
  
  if (missingOptional.length > 0) {
    console.log(`\n⚠️  ${missingOptional.length} optional variable(s) not set`);
    console.log('   Consider setting them for additional functionality:');
    missingOptional.slice(0, 3).forEach(varName => {
      const config = HARDHAT_VARS[varName];
      console.log(`   export HARDHAT_VAR_${varName}="${config.example}"`);
    });
    if (missingOptional.length > 3) {
      console.log(`   ... and ${missingOptional.length - 3} more`);
    }
  }
  
  console.log('\n🔗 Useful Commands:');
  console.log('   echo $HARDHAT_VAR_SEPOLIA_PRIVATE_KEY  - Check if variable is set');
  console.log('   unset HARDHAT_VAR_SEPOLIA_PRIVATE_KEY  - Remove variable');
  console.log('   env | grep HARDHAT_VAR                 - List all HARDHAT_VAR_ variables');
  
  console.log('\n🔗 Get API Keys:');
  console.log('   • Alchemy: https://www.alchemy.com/');
  console.log('   • Infura: https://infura.io/');
  console.log('   • Etherscan: https://etherscan.io/apis');
  
  console.log('\n⚠️  Security Note:');
  console.log('   Hardhat 3 Alpha uses HARDHAT_VAR_ prefixed environment variables');
  console.log('   These are standard environment variables - keep them secure!');
  console.log('   Never commit your private keys to version control!');
  
  console.log('\n📝 Quick Setup Example:');
  console.log('   # Set required variables for Sepolia deployment');
  console.log('   export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="your_private_key"');
  console.log('   export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"');
  console.log('   ');
  console.log('   # Test compilation');
  console.log('   npm run hardhat:compile');
  console.log('   ');
  console.log('   # Deploy to Flow EVM Testnet');
  console.log('   npx hardhat run scripts/deploy-memento.ts --network flowTestnet');
}

// Run the check
checkHardhatVars(); 