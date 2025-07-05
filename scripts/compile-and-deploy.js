#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function compileContract() {
  console.log("🔨 Compiling MementoVol1 contract...");
  
  try {
    // Use solc directly to compile the contract
    const contractPath = join(__dirname, '../contracts/MementoVol1.sol');
    const contractSource = readFileSync(contractPath, 'utf8');
    
    // Create a simple solc compilation
    const solcInput = {
      language: 'Solidity',
      sources: {
        'MementoVol1.sol': {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    };
    
    // Use solc to compile
    const solc = await import('solc');
    const output = JSON.parse(solc.compile(JSON.stringify(solcInput)));
    
    if (output.errors) {
      console.log("❌ Compilation errors:");
      output.errors.forEach(error => console.log(error.formattedMessage));
      return null;
    }
    
    const contract = output.contracts['MementoVol1.sol']['MementoVol1'];
    console.log("✅ Contract compiled successfully!");
    
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
    
  } catch (error) {
    console.log("❌ Compilation failed:", error.message);
    console.log("📝 Falling back to existing artifacts...");
    
    // Fallback to existing artifacts
    try {
      const artifactPath = join(__dirname, '../artifacts/contracts/MementoVol1.sol/MementoVol1.json');
      const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
      console.log("✅ Using existing compiled artifact");
      return {
        abi: artifact.abi,
        bytecode: artifact.bytecode
      };
    } catch (fallbackError) {
      console.log("❌ No existing artifacts found:", fallbackError.message);
      return null;
    }
  }
}

async function deployContract(compiledContract) {
  console.log("🚀 Deploying Memento Machina - Vol 1 Contract to Flow EVM");
  console.log("=========================================");

  // Get private key from environment
  const privateKey = process.env.HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY environment variable is required");
  }

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider("https://testnet.evm.nodes.onflow.org");
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📡 Network: Flow EVM Testnet`);
  console.log(`⛓️  Chain ID: 545`);
  console.log(`👤 Deployer: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} FLOW`);

  if (balance === 0n) {
    console.log("❌ Insufficient balance. Get testnet FLOW from: https://testnet-faucet.onflow.org/");
    return null;
  }

  console.log("📝 Deploying MementoVol1 contract...");
  
  // Create contract factory
  const contractFactory = new ethers.ContractFactory(
    compiledContract.abi,
    compiledContract.bytecode,
    wallet
  );
  
  // Deploy contract
  const contract = await contractFactory.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  
  // Get deployment transaction
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    console.log(`🔗 Transaction Hash: ${deployTx.hash}`);
    console.log(`⛽ Gas Used: ${deployTx.gasLimit?.toString() || "N/A"}`);
  }

  // Contract info
  console.log("\n📋 Contract Information:");
  console.log(`🏷️  Name: ${await contract.name()}`);
  console.log(`🔤 Symbol: ${await contract.symbol()}`);
  console.log(`💎 Early Bird Price: ${ethers.formatEther(await contract.EARLY_BIRD_PRICE())} FLOW (first 200 mints)`);
  console.log(`💎 Regular Price: ${ethers.formatEther(await contract.REGULAR_PRICE())} FLOW (after 200 mints)`);
  console.log(`💎 Current Price: ${ethers.formatEther(await contract.getCurrentPrice())} FLOW`);
  console.log(`👑 Owner: ${await contract.owner()}`);
  console.log(`🔢 Max Supply: ${await contract.MAX_SUPPLY()}`);
  console.log(`⚡ Early Bird Limit: ${await contract.EARLY_BIRD_LIMIT()}`);
  console.log(`⏰ Minting Duration: ${await contract.MINTING_DURATION()} seconds (7 days)`);

  console.log(`🌐 View on Flow EVM Explorer: https://evm-testnet.flowscan.io/address/${contractAddress}`);

  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Update your environment variables:");
  console.log(`CONTRACT_ADDRESS_TESTNET=${contractAddress}`);
  console.log(`NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET=${contractAddress}`);
  
  return contractAddress;
}

async function main() {
  // Compile the contract
  const compiledContract = await compileContract();
  if (!compiledContract) {
    process.exit(1);
  }
  
  // Deploy the contract
  const contractAddress = await deployContract(compiledContract);
  if (!contractAddress) {
    process.exit(1);
  }
  
  // Show verification instructions
  console.log("\n🔍 Contract Verification Instructions");
  console.log("=====================================");
  console.log("🤖 Automated Verification Command:");
  console.log(`   npx hardhat verify --network flowTestnet ${contractAddress}`);
  console.log("");
  console.log("📋 Manual Verification (Flow EVM Blockscout):");
  console.log(`   1. Go to: https://evm-testnet.flowscan.io/address/${contractAddress}`);
  console.log(`   2. Click "Contract" tab`);
  console.log(`   3. Click "Verify & Publish"`);
  console.log(`   4. Fill in the details:`);
  console.log(`      - Contract Name: MementoVol1`);
  console.log(`      - Compiler Version: 0.8.28`);
  console.log(`      - Optimization: No`);
  console.log(`      - Constructor Arguments: (leave empty - no constructor args)`);
  console.log(`   5. Copy and paste your complete contracts/MementoVol1.sol source code`);
  console.log(`   6. Click "Verify & Publish"`);
  console.log("");
  console.log("🔗 Direct Links:");
  console.log(`   📍 Contract: https://evm-testnet.flowscan.io/address/${contractAddress}`);
  console.log(`   🔍 Verify: https://evm-testnet.flowscan.io/address/${contractAddress}#code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 