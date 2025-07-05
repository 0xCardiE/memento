import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
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
    return;
  }

  // Read compiled contract
  const contractPath = join(__dirname, '../artifacts/contracts/MementoVol1.sol/MementoVol1.json');
  const contractJson = JSON.parse(readFileSync(contractPath, 'utf8'));
  
  console.log("📝 Deploying MementoVol1 contract...");
  
  // Create contract factory
  const contractFactory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
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
  console.log(`💎 Generation Price: ${ethers.formatEther(await contract.generationPrice())} FLOW`);
  console.log(`👑 Owner: ${await contract.owner()}`);
  console.log(`🔢 Max Supply: ${await contract.MAX_SUPPLY()}`);
  console.log(`⏰ Minting Duration: ${await contract.MINTING_DURATION()} seconds (7 days)`);

  console.log(`🌐 View on Flow EVM Explorer: https://evm-testnet.flowscan.io/address/${contractAddress}`);

  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Update your environment variables:");
  console.log(`CONTRACT_ADDRESS_TESTNET=${contractAddress}`);
  console.log(`NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET=${contractAddress}`);
  
  // Automatic verification
  await verifyContract(contractAddress);
}

// Contract verification function
async function verifyContract(contractAddress) {
  console.log("\n🔍 Contract Verification Instructions");
  console.log("=====================================");
  
  // Show both automated and manual verification options
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
  
  console.log("📝 Quick Verification Commands:");
  console.log("   # Try automated verification:");
  console.log(`   npx hardhat verify --network flowTestnet ${contractAddress}`);
  console.log("");
  console.log("   # If automated fails, get source code for manual verification:");
  console.log(`   cat contracts/MementoVol1.sol`);
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