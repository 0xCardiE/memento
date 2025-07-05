#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Get contract address from command line or use the deployed one
  const contractAddress = process.argv[2] || '0xE88134e7288614D73A084e2e8ea92ed61B39C1ae';

  console.log("🔍 Memento Machina Contract Verification");
  console.log("========================================");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log("");

  console.log("🤖 Method 1: Automated Hardhat Verification");
  console.log("-".repeat(45));
  console.log("Run this command:");
  console.log(`npx hardhat verify --network flowTestnet ${contractAddress}`);
  console.log("");

  console.log("📋 Method 2: Manual Verification on Flow EVM Blockscout");
  console.log("-".repeat(55));
  console.log("1. Go to Flow EVM Blockscout:");
  console.log(`   https://evm-testnet.flowscan.io/address/${contractAddress}`);
  console.log("");
  console.log("2. Click 'Contract' tab → 'Verify & Publish'");
  console.log("");
  console.log("3. Fill in these details:");
  console.log("   - Contract Name: MementoVol1");
  console.log("   - Compiler Version: 0.8.28");
  console.log("   - Optimization: No");
  console.log("   - Constructor Arguments: (leave empty)");
  console.log("");
  console.log("4. Copy the FLATTENED source code below and paste it:");
  console.log("");

  // Check if flattened contract exists, if not generate it
  const flattenedPath = join(__dirname, '../contracts/MementoVol1-flattened.sol');

  if (!existsSync(flattenedPath)) {
    console.log("📝 Generating flattened contract...");
    try {
      await execAsync('npx hardhat flatten contracts/MementoVol1.sol > contracts/MementoVol1-flattened.sol');
      console.log("✅ Flattened contract generated!");
    } catch (error) {
      console.log("❌ Failed to generate flattened contract:", error.message);
      console.log("Please run: npx hardhat flatten contracts/MementoVol1.sol > contracts/MementoVol1-flattened.sol");
      process.exit(1);
    }
  }

  // Read and display the flattened contract source
  try {
    const contractSource = readFileSync(flattenedPath, 'utf8');
    
    console.log("📄 Flattened Contract Source Code (includes all OpenZeppelin dependencies):");
    console.log("=".repeat(80));
    console.log(contractSource);
    console.log("=".repeat(80));
    
    // Get file size for reference
    const fileSizeKB = Math.round(contractSource.length / 1024);
    console.log(`📊 Contract size: ${fileSizeKB} KB (includes all dependencies)`);
    
  } catch (error) {
    console.log("❌ Could not read flattened contract source code.");
    console.log("Please run: npx hardhat flatten contracts/MementoVol1.sol > contracts/MementoVol1-flattened.sol");
    console.log("Error:", error.message);
  }

  console.log("");
  console.log("🔗 Quick Links:");
  console.log(`   📍 Contract Page: https://evm-testnet.flowscan.io/address/${contractAddress}`);
  console.log(`   🔍 Verify Page: https://evm-testnet.flowscan.io/address/${contractAddress}#code`);
  console.log("");
  console.log("💡 Commands:");
  console.log("   npm run verify [contract-address]");
  console.log("   npm run verify:contract [contract-address]");
  console.log("   npx hardhat flatten contracts/MementoVol1.sol > contracts/MementoVol1-flattened.sol");
}

// Run the main function
main().catch(error => {
  console.error("❌ Script failed:", error.message);
  process.exit(1);
}); 