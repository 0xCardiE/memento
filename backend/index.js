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

// Initialize provider and wallet with Flow EVM optimizations
const provider = new ethers.JsonRpcProvider(chain.rpcUrl, {
  name: chain.name,
  chainId: chain.chainId,
}, {
  // Optimized for Flow EVM's ~6 second block time
  pollingInterval: 3000, // 3 seconds (faster than block time for responsiveness)
  // Reduce batch size for better compatibility
  batchStallTime: 10,
  batchMaxSize: 1,
  // Add caching for better performance
  cacheTimeout: 300000, // 5 minutes
});

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
  "event MementoRequested(uint256 indexed tokenId, address indexed creator, string title, string content, string aiPrompt, uint256 timestamp)",
  "event MementoGenerated(uint256 indexed tokenId, address indexed creator, string imageUri, uint256 timestamp)",
  "function updateMementoUri(uint256 tokenId, string memory uri) external",
  "function getPendingMementos() external view returns (uint256[] memory)",
  "function getMemento(uint256 tokenId) external view returns (string memory title, string memory content, string memory aiPrompt, address creator, uint256 timestamp, bool isActive, string memory imageUri, bool isGenerated)",
  "function isMintingActive() external view returns (bool)",
  "function getRemainingSupply() external view returns (uint256)",
  "function getRemainingMintTime() external view returns (uint256)",
  "function totalMementos() external view returns (uint256)",
  "function owner() external view returns (address)"
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

console.log(`🚀 Backend service starting...`);
console.log(`📡 Network: ${chain.name}`);
console.log(`🔗 RPC URL: ${chain.rpcUrl}`);
console.log(`📄 Contract: ${contractAddress}`);
console.log(`🔑 Admin: ${wallet.address}`);

// Network health check
try {
  const networkCheck = await provider.getNetwork();
  console.log(`✅ Network connected: Chain ID ${networkCheck.chainId}, Name: ${networkCheck.name}`);
  
  // Use direct RPC call for fresh block number
  const rpcResponse = await provider.send('eth_blockNumber', []);
  const latestBlock = parseInt(rpcResponse, 16);
  const blockDetails = await provider.getBlock(latestBlock);
  console.log(`📊 Latest block: ${latestBlock}, timestamp: ${blockDetails.timestamp}`);
  
  const blockAge = Math.floor((Date.now() - blockDetails.timestamp * 1000) / 1000);
  console.log(`⏰ Block age: ${blockAge} seconds`);
  
  if (blockAge > 120) { // More than 2 minutes old
    console.log(`⚠️ Warning: Latest block is ${blockAge} seconds old - network might be slow`);
  }
} catch (networkError) {
  console.error(`❌ Network health check failed:`, networkError.message);
}

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

// Track processed token IDs to prevent duplicates
const processedTokenIds = new Set();

// Event listener for MementoRequested events with Flow EVM compatibility
async function startEventListener() {
  try {
    console.log(`👂 Starting event listener for MementoRequested events...`);
    
    // More robust event listener with error handling for Flow EVM compatibility
    const eventFilter = contract.filters.MementoRequested();
    // Use direct RPC call to avoid caching issues
    const rpcResponse = await provider.send('eth_blockNumber', []);
    let lastProcessedBlock = parseInt(rpcResponse, 16);
    
    console.log(`🔍 Starting from block: ${lastProcessedBlock}`);
    console.log(`🔍 Event filter:`, eventFilter);
    
    // Set up event listener with extensive debugging and duplicate prevention
    contract.on('MementoRequested', async (...args) => {
      try {
        console.log(`\n📡 Raw event args received:`, args);
        console.log(`📡 Number of args:`, args.length);
        
        // Extract event data - last argument is the event object
        const event = args[args.length - 1];
        const [tokenId, creator, title, content, aiPrompt, timestamp] = args.slice(0, -1);
        
        const tokenIdStr = tokenId.toString();
        
        console.log(`\n🔔 New MementoRequested event detected!`);
        console.log(`🎯 Token ID: ${tokenIdStr}`);
        console.log(`👤 Creator: ${creator}`);
        console.log(`⏰ Timestamp: ${timestamp.toString()}`);
        console.log(`🔗 Transaction: ${event.transactionHash}`);
        
        // Check if already processed to prevent duplicates
        if (processedTokenIds.has(tokenIdStr)) {
          console.log(`⚠️ Token ID ${tokenIdStr} already processed, skipping duplicate`);
          return;
        }
        
        // Mark as being processed
        processedTokenIds.add(tokenIdStr);
        console.log(`✅ Processing Token ID ${tokenIdStr} (real-time event)`);
        
        await processMementoRequest(tokenIdStr, title, content, aiPrompt);
      } catch (error) {
        console.error(`❌ Failed to process memento request:`, error.message);
        console.error(`❌ Error details:`, error);
      }
    });
    
    // Set up error handler for the provider (not contract)
    provider.on('error', (error) => {
      console.error(`⚠️ Provider error (continuing...):`, error.message);
      console.error(`⚠️ Provider error details:`, error);
    });
    
    // Add debugging for internal provider events
    console.log(`🔍 Provider polling interval: ${provider.pollingInterval}ms`);
    
    // Add a fallback polling mechanism for robustness
    const pollForEvents = async () => {
      try {
        // Use direct RPC call to avoid caching issues
        const rpcResponse = await provider.send('eth_blockNumber', []);
        const currentBlock = parseInt(rpcResponse, 16);
        const currentTime = new Date().toISOString();
        
        console.log(`🔄 [${currentTime}] Polling: current block ${currentBlock}, last processed ${lastProcessedBlock}`);
        
        // Check if we're getting the same block repeatedly
        if (currentBlock === lastProcessedBlock) {
          console.log(`⚠️ Block number hasn't changed - checking network connection...`);
          
          // Try to get block details to verify connection
          try {
            const blockDetails = await provider.getBlock(currentBlock);
            console.log(`📊 Block ${currentBlock} timestamp: ${blockDetails.timestamp}, hash: ${blockDetails.hash}`);
            
            // Check if this is a very recent block (should be within last few minutes)
            const blockTime = blockDetails.timestamp * 1000; // Convert to milliseconds
            const timeDiff = Date.now() - blockTime;
            console.log(`⏰ Block age: ${Math.floor(timeDiff / 1000)} seconds`);
            
            if (timeDiff > 60000) { // More than 1 minute old
              console.log(`⚠️ Block seems old - possible network sync issue`);
            }
            

          } catch (blockError) {
            console.error(`❌ Failed to get block details:`, blockError.message);
          }
        }
        
        if (currentBlock > lastProcessedBlock) {
          console.log(`🔄 Querying events from block ${lastProcessedBlock + 1} to ${currentBlock}`);
          
          // Try multiple methods to fetch logs
          try {
            // Method 1: Contract queryFilter (what we're currently using)
            const events = await contract.queryFilter(
              eventFilter,
              lastProcessedBlock + 1,
              currentBlock
            );
            
            console.log(`🔄 Found ${events.length} events via queryFilter`);
            
            
            
            // Process events from the working method
            for (const event of events) {
              console.log(`🔄 Processing event from block ${event.blockNumber}`);
              console.log(`🔄 Event details:`, event);
              const { tokenId, creator, title, content, aiPrompt, timestamp } = event.args;
              
              const tokenIdStr = tokenId.toString();
              
              console.log(`🎯 Processing Token ID: ${tokenIdStr}`);
              console.log(`👤 Creator: ${creator}`);
              console.log(`⏰ Timestamp: ${timestamp.toString()}`);
              
              // Check if already processed to prevent duplicates
              if (processedTokenIds.has(tokenIdStr)) {
                console.log(`⚠️ Token ID ${tokenIdStr} already processed, skipping duplicate (polling)`);
                continue;
              }
              
              // Mark as being processed
              processedTokenIds.add(tokenIdStr);
              console.log(`✅ Processing Token ID ${tokenIdStr} (polling backup)`);
              
              try {
                await processMementoRequest(tokenIdStr, title, content, aiPrompt);
              } catch (error) {
                console.error(`❌ Failed to process memento request:`, error.message);
              }
            }
            
            lastProcessedBlock = currentBlock;
          } catch (logError) {
            console.error(`❌ Error fetching logs:`, logError.message);
            console.error(`❌ Log error details:`, logError);
          }
        }
      } catch (error) {
        console.error(`⚠️ Polling error (continuing...):`, error.message);
        console.error(`⚠️ Polling error details:`, error);
      }
    };
    
    // Poll every 10 seconds as backup (faster than Flow EVM block time)
    setInterval(pollForEvents, 10000);
    
    console.log(`✅ Event listener started successfully (with polling backup)`);
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