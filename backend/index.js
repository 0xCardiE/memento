import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
const envPath = path.join(__dirname, '..', '.env');
console.log(`🔍 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Environment variables
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SWARM_GATEWAY = process.env.SWARM_GATEWAY || 'https://gateway.ethswarm.org';
const SWARM_BATCH_ID = process.env.SWARM_BATCH_ID || 'c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278';
const NETWORK = process.env.NETWORK || 'testnet';

// Debug environment variables (without sensitive data)
console.log(`🔧 Environment variables loaded:`);
console.log(`   NETWORK: ${NETWORK}`);
console.log(`   ADMIN_PRIVATE_KEY: ${ADMIN_PRIVATE_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`   OPENAI_API_KEY: ${OPENAI_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`   CONTRACT_ADDRESS_TESTNET: ${process.env.CONTRACT_ADDRESS_TESTNET ? '✅ Found' : '❌ Missing'}`);
console.log(`   CONTRACT_ADDRESS_MAINNET: ${process.env.CONTRACT_ADDRESS_MAINNET ? '✅ Found' : '❌ Missing'}`);
console.log(`   SWARM_GATEWAY: ${SWARM_GATEWAY}`);
console.log(`   SWARM_BATCH_ID: ${SWARM_BATCH_ID ? '✅ Found' : '❌ Missing'}`);

// Default image generation settings
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_MODEL = 'dall-e-3';

// Validation
if (!ADMIN_PRIVATE_KEY) {
  console.error('❌ ADMIN_PRIVATE_KEY is required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required');
  process.exit(1);
}

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

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

// Contract configuration
const contractAddress = NETWORK === 'mainnet' 
  ? process.env.CONTRACT_ADDRESS_MAINNET 
  : process.env.CONTRACT_ADDRESS_TESTNET;

if (!contractAddress) {
  console.error(`❌ Contract address for ${NETWORK} network is required`);
  process.exit(1);
}

const contractABI = [
  "event MementoRequested(uint256 indexed tokenId, address indexed user, string title, string content, string aiPrompt)",
  "event MementoGenerated(uint256 indexed tokenId, string imageUrl)",
  "function updateMementoUri(uint256 tokenId, string memory uri) external",
  "function getPendingMementos() external view returns (uint256[] memory)",
  "function owner() external view returns (address)"
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

console.log(`🚀 Backend service starting...`);
console.log(`📡 Network: ${chain.name}`);
console.log(`📄 Contract: ${contractAddress}`);
console.log(`🔑 Admin: ${wallet.address}`);

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
        timeout: 60000 // 60 seconds timeout
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
      timeout: 30000 // 30 seconds timeout
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
        timeout: 60000 // 60 seconds timeout
      }
    );

    const swarmHash = response.data.reference;
    const bzzUrl = `${SWARM_GATEWAY}/bzz/${swarmHash}`;
    
    console.log(`✅ Image stored on SWARM: ${bzzUrl}`);
    return bzzUrl;
  } catch (error) {
    console.error(`❌ Failed to store image on SWARM:`, error.response?.data || error.message);
    throw new Error(`SWARM storage failed: ${error.response?.data || error.message}`);
  }
}

// Update NFT metadata with image URL
async function updateNFTMetadata(tokenId, title, content, imageUrl) {
  try {
    console.log(`🔄 Updating NFT metadata for Token ID: ${tokenId}`);
    
    const metadata = {
      name: title,
      description: content,
      image: imageUrl,
      external_url: imageUrl,
      attributes: [
        {
          trait_type: "Type",
          value: "AI Generated Geological Pattern"
        },
        {
          trait_type: "Generation Date",
          value: new Date().toISOString()
        }
      ]
    };

    // Convert metadata to JSON string
    const metadataJson = JSON.stringify(metadata, null, 2);
    
    // Store metadata on SWARM
    const metadataResponse = await axios.post(
      `${SWARM_GATEWAY}/bzz`,
      metadataJson,
      {
        headers: {
          'Content-Type': 'application/json',
          'Swarm-Postage-Batch-Id': SWARM_BATCH_ID,
        },
        timeout: 30000
      }
    );

    const metadataHash = metadataResponse.data.reference;
    const metadataUrl = `${SWARM_GATEWAY}/bzz/${metadataHash}`;
    
    console.log(`✅ Metadata stored on SWARM: ${metadataUrl}`);
    
    // Update NFT URI in contract
    const tx = await contract.updateMementoUri(tokenId, metadataUrl);
    await tx.wait();
    
    console.log(`✅ NFT metadata updated successfully. Transaction: ${tx.hash}`);
    
    return metadataUrl;
  } catch (error) {
    console.error(`❌ Failed to update NFT metadata:`, error.message);
    throw new Error(`NFT metadata update failed: ${error.message}`);
  }
}

// Process memento request
async function processMementoRequest(tokenId, title, content, aiPrompt) {
  try {
    console.log(`\n🔄 Processing memento request for Token ID: ${tokenId}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📄 Content: ${content}`);
    console.log(`🎨 AI Prompt: ${aiPrompt}`);
    
    // Generate image
    const imageUrl = await generateImage(aiPrompt);
    
    // Download image
    const imageBuffer = await downloadImage(imageUrl);
    
    // Store on SWARM
    const bzzUrl = await storeImageOnSwarm(imageBuffer, tokenId);
    
    // Update NFT metadata
    const metadataUrl = await updateNFTMetadata(tokenId, title, content, bzzUrl);
    
    console.log(`✅ Memento processing completed successfully!`);
    console.log(`🖼️  Image URL: ${bzzUrl}`);
    console.log(`📄 Metadata URL: ${metadataUrl}`);
    
    return { imageUrl: bzzUrl, metadataUrl };
  } catch (error) {
    console.error(`❌ Failed to process memento request:`, error.message);
    throw error;
  }
}

// Event listener for MementoRequested events
async function startEventListener() {
  try {
    console.log(`👂 Starting event listener for MementoRequested events...`);
    
    contract.on('MementoRequested', async (tokenId, user, title, content, aiPrompt, event) => {
      console.log(`\n🔔 New MementoRequested event detected!`);
      console.log(`🎯 Token ID: ${tokenId.toString()}`);
      console.log(`👤 User: ${user}`);
      console.log(`🔗 Transaction: ${event.transactionHash}`);
      
      try {
        await processMementoRequest(tokenId.toString(), title, content, aiPrompt);
      } catch (error) {
        console.error(`❌ Failed to process memento request:`, error.message);
      }
    });
    
    console.log(`✅ Event listener started successfully`);
  } catch (error) {
    console.error(`❌ Failed to start event listener:`, error.message);
    throw error;
  }
}

// Process any pending mementos on startup
async function processPendingMementos() {
  try {
    console.log(`🔍 Checking for pending mementos...`);
    
    const pendingTokenIds = await contract.getPendingMementos();
    
    if (pendingTokenIds.length === 0) {
      console.log(`✅ No pending mementos found`);
      return;
    }
    
    console.log(`📋 Found ${pendingTokenIds.length} pending mementos`);
    
    // Process each pending memento
    for (const tokenId of pendingTokenIds) {
      console.log(`🔄 Processing pending memento: ${tokenId.toString()}`);
      
      // You would need to implement a way to get the original request data
      // For now, we'll just log that we found them
      console.log(`⚠️  Found pending memento ${tokenId.toString()}, but need original request data to process`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to process pending mementos:`, error.message);
  }
}

// Start the service
async function startService() {
  try {
    console.log(`🚀 Starting memento processing service...`);
    
    // Process any pending mementos
    await processPendingMementos();
    
    // Start event listener
    await startEventListener();
    
    console.log(`🎉 Service started successfully!`);
    console.log(`📱 Ready to process memento requests`);
    
  } catch (error) {
    console.error(`💥 Failed to start service:`, error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n👋 Shutting down gracefully...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n👋 Shutting down gracefully...`);
  process.exit(0);
});

// Start the service
startService().catch(error => {
  console.error(`💥 Fatal error:`, error.message);
  process.exit(1);
}); 