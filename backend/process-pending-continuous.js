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

// Configuration
const CHECK_INTERVAL = 30000; // 30 seconds
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

// Contract configuration
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

console.log(`🔄 Continuous Pending NFT Processor - ${chain.name}`);
console.log(`📄 Contract: ${contractAddress}`);
console.log(`⏰ Check interval: ${CHECK_INTERVAL / 1000} seconds`);

// Track processing state
let isProcessing = false;
let runCount = 0;

// [Include all the helper functions from process-pending.js]
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

async function updateNFTImageUri(tokenId, imageUrl) {
  try {
    console.log(`🔄 Updating NFT image URI for Token ID: ${tokenId}`);
    
    const tx = await contract.updateMementoUri(tokenId, imageUrl, {
      gasLimit: 200000,
    });
    
    console.log(`⏳ Transaction sent, hash: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ NFT image URI updated successfully. Block: ${receipt.blockNumber}`);
    return imageUrl;
  } catch (error) {
    console.error(`❌ Failed to update NFT image URI:`, error.message);
    throw new Error(`NFT image URI update failed: ${error.message}`);
  }
}

async function processPendingMemento(tokenId) {
  try {
    console.log(`🔄 Processing pending memento Token ID: ${tokenId}`);
    
    const mementoData = await contract.getMemento(tokenId);
    const [title, content, aiPrompt, creator, timestamp, isActive, imageUri, isGenerated] = mementoData;
    
    if (isGenerated) {
      console.log(`✅ Token ID ${tokenId} already has generated image`);
      return { tokenId, status: 'already_generated' };
    }
    
    if (!isActive) {
      console.log(`⚠️ Token ID ${tokenId} is not active, skipping`);
      return { tokenId, status: 'inactive' };
    }
    
    // Generate and process image
    const generatedImageUrl = await generateImage(aiPrompt);
    const imageBuffer = await downloadImage(generatedImageUrl);
    const bzzUrl = await storeImageOnSwarm(imageBuffer, tokenId);
    await updateNFTImageUri(tokenId, bzzUrl);
    
    console.log(`✅ Token ID ${tokenId} processed successfully!`);
    return { tokenId, status: 'success', imageUri: bzzUrl };
    
  } catch (error) {
    console.error(`❌ Failed to process Token ID ${tokenId}:`, error.message);
    return { tokenId, status: 'failed', error: error.message };
  }
}

async function checkAndProcessPending() {
  if (isProcessing) {
    console.log(`⏳ Previous processing still running, skipping this cycle...`);
    return;
  }
  
  try {
    isProcessing = true;
    runCount++;
    
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 [${timestamp}] Check #${runCount} - Looking for pending mementos...`);
    
    const pendingTokenIds = await contract.getPendingMementos();
    
    if (pendingTokenIds.length === 0) {
      console.log(`✅ No pending mementos found`);
      return;
    }
    
    console.log(`📋 Found ${pendingTokenIds.length} pending mementos`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const tokenId of pendingTokenIds) {
      try {
        const result = await processPendingMemento(tokenId);
        
        if (result.status === 'success') {
          successCount++;
        } else if (result.status === 'failed') {
          failedCount++;
        }
        
        // Small delay between processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing Token ID ${tokenId}:`, error.message);
        failedCount++;
      }
    }
    
    console.log(`📊 Cycle ${runCount} complete: ${successCount} success, ${failedCount} failed`);
    
  } catch (error) {
    console.error(`❌ Error in check cycle:`, error.message);
  } finally {
    isProcessing = false;
  }
}

// Start the continuous process
async function startContinuousProcessing() {
  try {
    console.log(`🚀 Starting continuous pending NFT processor...`);
    
    // Network health check
    const networkCheck = await provider.getNetwork();
    console.log(`✅ Network connected: Chain ID ${networkCheck.chainId}`);
    
    // Initial check
    await checkAndProcessPending();
    
    // Set up interval
    const interval = setInterval(async () => {
      await checkAndProcessPending();
    }, CHECK_INTERVAL);
    
    console.log(`✅ Continuous processing started (every ${CHECK_INTERVAL / 1000} seconds)`);
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log(`\n👋 Stopping continuous processor...`);
      clearInterval(interval);
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log(`\n👋 Stopping continuous processor...`);
      clearInterval(interval);
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`💥 Failed to start continuous processing:`, error.message);
    process.exit(1);
  }
}

// Start the service
startContinuousProcessing(); 