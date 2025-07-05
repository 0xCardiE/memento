#!/usr/bin/env node

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🏦 Deploying SwarmVault Contract to Gnosis Chain");
  console.log("==============================================");

  // Get private key from environment
  const privateKey = process.env.GNOSIS_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ GNOSIS_PRIVATE_KEY environment variable is required");
  }

  // Create provider and wallet for Gnosis Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.gnosischain.com");
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📡 Network: Gnosis Chain`);
  console.log(`⛓️  Chain ID: 100`);
  console.log(`👤 Deployer: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} xDAI`);

  if (balance === 0n) {
    console.log("❌ Insufficient balance. Get xDAI from: https://bridge.gnosischain.com/");
    return;
  }

  // Read compiled contract
  const contractPath = join(__dirname, '../artifacts/contracts/SwarmVault.sol/SwarmVault.json');
  
  let contractJson;
  try {
    contractJson = JSON.parse(readFileSync(contractPath, 'utf8'));
  } catch (error) {
    console.log("❌ Contract not compiled. Run: npx hardhat compile");
    return;
  }
  
  console.log("📝 Deploying SwarmVault contract...");
  
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
  console.log("✅ SwarmVault deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  
  // Get deployment transaction
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    console.log(`🔗 Transaction Hash: ${deployTx.hash}`);
    console.log(`⛽ Gas Used: ${deployTx.gasLimit?.toString() || "N/A"}`);
  }

  // Contract info
  console.log("\n📋 Contract Information:");
  console.log(`🏦 Contract Name: SwarmVault`);
  console.log(`👑 Owner: ${await contract.owner()}`);
  console.log(`📫 PostageStamp Contract: ${await contract.POSTAGE_STAMP_CONTRACT()}`);
  console.log(`🎫 Batch ID: ${await contract.BATCH_ID()}`);
  console.log(`⚡ Auto Top-up Threshold: ${ethers.formatEther(await contract.autoTopUpThreshold())} xDAI`);
  console.log(`💰 Top-up Amount: ${ethers.formatEther(await contract.topUpAmount())} xDAI`);

  console.log(`🌐 View on Gnosis Scan: https://gnosisscan.io/address/${contractAddress}`);

  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Update your environment variables:");
  console.log(`SWARM_VAULT_ADDRESS=${contractAddress}`);
  
  console.log("\n💡 Next Steps:");
  console.log("1. Fund the vault with xDAI to start automatic postage stamp management");
  console.log("2. Set up monitoring for vault balance and postage stamp status");
  console.log("3. Configure Flow <-> Gnosis bridge for automatic funding");
  console.log(`4. Send xDAI directly to: ${contractAddress}`);
  
  console.log("\n🔗 Useful Commands:");
  console.log("# Check vault status");
  console.log(`cast call ${contractAddress} "getVaultStats()" --rpc-url https://rpc.gnosischain.com`);
  console.log("");
  console.log("# Contribute 1 xDAI to vault");
  console.log(`cast send ${contractAddress} "contribute()" --value 1ether --private-key $GNOSIS_PRIVATE_KEY --rpc-url https://rpc.gnosischain.com`);
  console.log("");
  console.log("# Manual top-up");
  console.log(`cast send ${contractAddress} "topUpPostageStamp()" --private-key $GNOSIS_PRIVATE_KEY --rpc-url https://rpc.gnosischain.com`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 