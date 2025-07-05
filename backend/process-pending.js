#!/usr/bin/env node

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Environment variables
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SWARM_GATEWAY = process.env.SWARM_GATEWAY || 'https://gateway.ethswarm.org';
const SWARM_BATCH_ID = process.env.SWARM_BATCH_ID || 'c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278';
const NETWORK = process.env.NETWORK || 'testnet';

// Constants
const DEFAULT_MODEL = 'dall-e-3';
const DEFAULT_IMAGE_SIZE = '1024x1024';

// Flow EVM chain configurations
const flowTestnet = {
  name: 'Flow EVM Testnet',
  chainId: 545,
  rpcUrl: 'https://testnet.evm.nodes.onflow.org',
};

const flowMainnet = {
  name: 'Flow EVM Mainnet', 
  chainId: 747,
  rpcUrl: 'https://mainnet.evm.nodes.onflow.org',
};

// Select chain based on network
const chain = NETWORK === 'mainnet' ? flowMainnet : flowTestnet;

// Validate required environment variables
if (!ADMIN_PRIVATE_KEY) {
  console.error('❌ ADMIN_PRIVATE_KEY is required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required');
  process.exit(1);
}

// Contract configuration - same as index.js
const contractAddress = NETWORK === 'mainnet' 
  ? process.env.CONTRACT_ADDRESS_MAINNET 
  : process.env.CONTRACT_ADDRESS_TESTNET;

if (!contractAddress) {
  console.error(`❌ Contract address for ${NETWORK} network is required`);
  process.exit(1);
}

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

const contractABI = [
  "function getPendingMementos() external view returns (uint256[] memory)",
  "function getMemento(uint256 tokenId) external view returns (string memory title, string memory content, string memory aiPrompt, address creator, uint256 timestamp, bool isActive, string memory imageUri, bool isGenerated)",
  "function updateMementoUri(uint256 tokenId, string memory uri) external",
  "function totalMementos() external view returns (uint256)"
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Debug environment variables (without sensitive data)
console.log(`🔧 Environment variables loaded:`);
console.log(`   NETWORK: ${NETWORK}`);
console.log(`   ADMIN_PRIVATE_KEY: ${ADMIN_PRIVATE_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`   OPENAI_API_KEY: ${OPENAI_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`   CONTRACT_ADDRESS_TESTNET: ${process.env.CONTRACT_ADDRESS_TESTNET ? '✅ Found' : '❌ Missing'}`);
console.log(`   CONTRACT_ADDRESS_MAINNET: ${process.env.CONTRACT_ADDRESS_MAINNET ? '✅ Found' : '❌ Missing'}`);
console.log(`   SWARM_GATEWAY: ${SWARM_GATEWAY}`);
console.log(`   SWARM_BATCH_ID: ${SWARM_BATCH_ID ? '✅ Found' : '❌ Missing'}`);

console.log(`🔧 Pending NFT Processor - ${chain.name}`);
console.log(`📄 Contract: ${contractAddress}`);
console.log(`🔗 RPC: ${chain.rpcUrl}`);
console.log(`🎨 OpenAI: ${OPENAI_API_KEY ? '✅ Connected' : '❌ Missing'}`);
console.log(`🌐 SWARM: ${SWARM_GATEWAY}`);
console.log(`📦 Batch ID: ${SWARM_BATCH_ID}`);

// Generate image using OpenAI DALL-E
async function generateImage(prompt) {
  try {
    console.log(`🎨 Generating image with prompt: "${prompt}"`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: DEFAULT_MODEL,
        prompt: prompt,
        n: 1,
        size: DEFAULT_IMAGE_SIZE,
        quality: 'standard',
        response_format: 'url'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    );

    const imageUrl = response.data.data[0].url;
    console.log(`✅ Image generated successfully: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error(`❌ Failed to generate image:`, error.response?.data || error.message);
    throw new Error(`Image generation failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Download image from URL
async function downloadImage(imageUrl) {
  try {
    console.log(`📥 Downloading image from: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log(`✅ Image downloaded successfully (${response.data.length} bytes)`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to download image:`, error.message);
    throw new Error(`Image download failed: ${error.message}`);
  }
}

// Store image on SWARM
async function storeImageOnSwarm(imageBuffer, tokenId) {
  try {
    console.log(`🌐 Storing image on SWARM network (Token ID: ${tokenId})`);
    
    const response = await axios.post(
      `${SWARM_GATEWAY}/bzz`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'image/png',
          'Swarm-Postage-Batch-Id': SWARM_BATCH_ID,
        },
        timeout: 60000
      }
    );

    const swarmHash = response.data.reference;
    const bzzUrl = `https://bzz.link/bzz/${swarmHash}`;
    
    console.log(`✅ Image stored on SWARM: ${bzzUrl}`);
    return bzzUrl;
  } catch (error) {
    console.error(`❌ Failed to store image on SWARM:`, error.response?.data || error.message);
    throw new Error(`SWARM storage failed: ${error.response?.data || error.message}`);
  }
}

// Update NFT with image URI
async function updateNFTImageUri(tokenId, imageUrl) {
  try {
    console.log(`🔄 Updating NFT image URI for Token ID: ${tokenId}`);
    console.log(`🖼️  Image URL: ${imageUrl}`);
    
    const tx = await contract.updateMementoUri(tokenId, imageUrl, {
      gasLimit: 200000,
    });
    
    console.log(`⏳ Transaction sent, hash: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ NFT image URI updated successfully in smart contract. Block: ${receipt.blockNumber}`);
    return imageUrl;
  } catch (error) {
    console.error(`❌ Failed to update NFT image URI:`, error.message);
    throw new Error(`NFT image URI update failed: ${error.message}`);
  }
}

// Process a single pending memento
async function processPendingMemento(tokenId) {
  try {
    console.log(`\n🔄 Processing pending memento Token ID: ${tokenId}`);
    
    // Get memento data from contract
    const mementoData = await contract.getMemento(tokenId);
    const [title, content, aiPrompt, creator, timestamp, isActive, imageUri, isGenerated] = mementoData;
    
    // Check if already generated
    if (isGenerated) {
      console.log(`✅ Token ID ${tokenId} already has generated image: ${imageUri}`);
      return { tokenId, status: 'already_generated', imageUri };
    }
    
    // Check if active
    if (!isActive) {
      console.log(`⚠️ Token ID ${tokenId} is not active, skipping`);
      return { tokenId, status: 'inactive' };
    }
    
    console.log(`📝 Title: ${title}`);
    console.log(`📄 Content: ${content}`);
    console.log(`🎨 AI Prompt: ${aiPrompt}`);
    console.log(`👤 Creator: ${creator}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    
    // Generate image
    const generatedImageUrl = await generateImage(aiPrompt);
    
    // Download image
    const imageBuffer = await downloadImage(generatedImageUrl);
    
    // Store on SWARM
    const bzzUrl = await storeImageOnSwarm(imageBuffer, tokenId);
    
    // Update contract
    await updateNFTImageUri(tokenId, bzzUrl);
    
    console.log(`✅ Token ID ${tokenId} processing completed successfully!`);
    console.log(`🖼️  Final image URL: ${bzzUrl}`);
    
    return { tokenId, status: 'success', imageUri: bzzUrl };
    
  } catch (error) {
    console.error(`❌ Failed to process Token ID ${tokenId}:`, error.message);
    return { tokenId, status: 'failed', error: error.message };
  }
}

// Main processing function
async function processPendingMementos() {
  try {
    console.log(`\n🔍 Checking for pending mementos...`);
    
    // Get total mementos count for context
    const totalMementos = await contract.totalMementos();
    console.log(`📊 Total mementos in contract: ${totalMementos}`);
    
    // Get pending mementos
    const pendingTokenIds = await contract.getPendingMementos();
    
    if (pendingTokenIds.length === 0) {
      console.log(`✅ No pending mementos found - all NFTs are up to date!`);
      return { processed: 0, results: [] };
    }
    
    console.log(`📋 Found ${pendingTokenIds.length} pending mementos to process`);
    console.log(`🎯 Pending Token IDs: ${pendingTokenIds.map(id => id.toString()).join(', ')}`);
    
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Process each pending memento
    for (let i = 0; i < pendingTokenIds.length; i++) {
      const tokenId = pendingTokenIds[i];
      console.log(`\n📍 Processing ${i + 1}/${pendingTokenIds.length}: Token ID ${tokenId}`);
      
      try {
        const result = await processPendingMemento(tokenId);
        results.push(result);
        
        if (result.status === 'success') {
          successCount++;
        } else if (result.status === 'failed') {
          failedCount++;
        } else {
          skippedCount++;
        }
        
        // Small delay between processing to avoid overwhelming services
        if (i < pendingTokenIds.length - 1) {
          console.log(`⏳ Waiting 2 seconds before next NFT...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Unexpected error processing Token ID ${tokenId}:`, error.message);
        results.push({ tokenId: tokenId.toString(), status: 'failed', error: error.message });
        failedCount++;
      }
    }
    
    // Summary
    console.log(`\n📊 Processing Summary:`);
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📋 Total attempted: ${pendingTokenIds.length}`);
    
    return { processed: pendingTokenIds.length, results, successCount, failedCount, skippedCount };
    
  } catch (error) {
    console.error(`❌ Failed to process pending mementos:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log(`🚀 Starting pending NFT processor...`);
    
    // Network health check
    const networkCheck = await provider.getNetwork();
    console.log(`✅ Network connected: Chain ID ${networkCheck.chainId}`);
    
    // Get latest block to verify connection
    const latestBlock = await provider.getBlockNumber();
    console.log(`📊 Latest block: ${latestBlock}`);
    
    // Process pending mementos
    const result = await processPendingMementos();
    
    console.log(`\n🎉 Processing completed!`);
    
    // Exit with appropriate code
    if (result.failedCount > 0) {
      console.log(`⚠️  Some NFTs failed to process. Check logs above.`);
      process.exit(1);
    } else {
      console.log(`✅ All pending NFTs processed successfully!`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error(`💥 Fatal error:`, error.message);
    console.error(`💥 Stack trace:`, error.stack);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log(`\n👋 Interrupted by user. Exiting gracefully...`);
  process.exit(0);
});

// Run the script
main(); 