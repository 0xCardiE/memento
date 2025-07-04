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
  console.log("🚀 Deploying Mement Machina - Vol 1 Contract to Flow EVM");
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

  console.log(`🌐 View on Explorer: https://evm-testnet.flowscan.io/address/${contractAddress}`);

  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Update your environment variables:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 