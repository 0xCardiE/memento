const { createPublicClient, createWalletClient, http, webSocket } = require("viem");
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');
const OpenAI = require('openai');
const fetch = require('node-fetch');

// Define Flow EVM chains
const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow EVM Testnet Explorer',
      url: 'https://evm-testnet.flowscan.io',
    },
  },
});

const flowMainnet = defineChain({
  id: 747,
  name: 'Flow EVM Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow EVM Mainnet Explorer',
      url: 'https://evm.flowscan.io',
    },
  },
});

// Environment variables
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = process.env.RPC_URL || "https://testnet.evm.nodes.onflow.org";
const SWARM_GATEWAY = process.env.SWARM_GATEWAY || "http://localhost:5555";
const NETWORK = process.env.NETWORK || "testnet"; // "testnet" or "mainnet"

// Validate required environment variables
if (!ADMIN_PRIVATE_KEY) {
    console.error("❌ ADMIN_PRIVATE_KEY environment variable is required");
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY environment variable is required");
    process.exit(1);
}

// Single SWARM batch ID for all storage operations
const SWARM_BATCH_ID = "c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278";

// Contract ABI for the events and functions we need
const MEMENTO_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "content",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "aiPrompt",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "MementoRequested",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_tokenId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_imageUri",
                "type": "string"
            }
        ],
        "name": "updateMementoUri",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_tokenId",
                "type": "uint256"
            }
        ],
        "name": "getMemento",
        "outputs": [
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "content",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "aiPrompt",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "string",
                "name": "imageUri",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "isGenerated",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPendingMementos",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Get the correct chain based on environment
const getChain = () => {
    if (NETWORK === "mainnet") {
        return flowMainnet;
    }
    return flowTestnet;
};

// Create clients
const publicClient = createPublicClient({
    chain: getChain(),
    transport: http(RPC_URL),
});

const account = privateKeyToAccount(ADMIN_PRIVATE_KEY);
const walletClient = createWalletClient({
    account,
    chain: getChain(),
    transport: http(RPC_URL),
});

// Generate AI image using OpenAI DALL-E
async function generateAIImage(prompt, tokenId) {
    console.log(`🎨 Generating AI image for token ${tokenId} with prompt: "${prompt}"`);
    
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        });

        const imageUrl = response.data[0].url;
        console.log(`✅ AI image generated successfully for token ${tokenId}`);
        return imageUrl;
    } catch (error) {
        console.error(`❌ Error generating AI image for token ${tokenId}:`, error);
        throw error;
    }
}

// Download image from URL
async function downloadImage(imageUrl) {
    console.log(`📥 Downloading image from: ${imageUrl}`);
    
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        
        const buffer = await response.buffer();
        console.log(`✅ Image downloaded successfully (${buffer.length} bytes)`);
        return buffer;
    } catch (error) {
        console.error(`❌ Error downloading image:`, error);
        throw error;
    }
}

// Store image on SWARM
async function storeOnSwarm(imageBuffer, tokenId) {
    console.log(`📦 Storing image on SWARM for token ${tokenId}`);
    console.log(`🐝 Using batch ID: ${SWARM_BATCH_ID}`);
    
    try {
        // Upload to SWARM using the single batch ID
        const uploadResponse = await fetch(`${SWARM_GATEWAY}/bzz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'image/png',
                'Swarm-Postage-Batch-Id': SWARM_BATCH_ID,
                'Swarm-Tag': `memento-${tokenId}`,
                'Swarm-Pin': 'true'
            },
            body: imageBuffer
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`SWARM upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const result = await uploadResponse.json();
        const swarmHash = result.reference;
        
        console.log(`✅ Image stored on SWARM with hash: ${swarmHash}`);
        return swarmHash;
    } catch (error) {
        console.error(`❌ Error storing image on SWARM for token ${tokenId}:`, error);
        throw error;
    }
}

// Update NFT URI in contract
async function updateNFTUri(tokenId, swarmHash) {
    console.log(`⛓️  Updating NFT URI for token ${tokenId} with SWARM hash: ${swarmHash}`);
    
    try {
        // Create the bzz.link URL
        const imageUri = `https://bzz.link/bzz/${swarmHash}`;
        
        // Update the URI in the contract
        const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            abi: MEMENTO_ABI,
            functionName: 'updateMementoUri',
            args: [BigInt(tokenId), imageUri],
        });

        console.log(`✅ NFT URI updated successfully! Transaction hash: ${hash}`);
        console.log(`🖼️  Image URL: ${imageUri}`);
        
        return hash;
    } catch (error) {
        console.error(`❌ Error updating NFT URI for token ${tokenId}:`, error);
        throw error;
    }
}

// Process a memento request
async function processMementoRequest(tokenId, creator, title, content, aiPrompt, timestamp) {
    console.log(`\n🚀 Processing memento request for token ${tokenId}`);
    console.log(`👤 Creator: ${creator}`);
    console.log(`📝 Title: ${title}`);
    console.log(`🎨 AI Prompt: ${aiPrompt}`);
    
    try {
        // Step 1: Generate AI image
        const imageUrl = await generateAIImage(aiPrompt, tokenId);
        
        // Step 2: Download the image
        const imageBuffer = await downloadImage(imageUrl);
        
        // Step 3: Store on SWARM
        const swarmHash = await storeOnSwarm(imageBuffer, tokenId);
        
        // Step 4: Update NFT URI
        await updateNFTUri(tokenId, swarmHash);
        
        console.log(`🎉 Successfully processed memento ${tokenId}!`);
        console.log(`🌐 Final URL: https://bzz.link/bzz/${swarmHash}\n`);
        
    } catch (error) {
        console.error(`❌ Failed to process memento ${tokenId}:`, error);
        console.log(`⏰ Will retry later...\n`);
    }
}

// Watch for MementoRequested events
async function watchMementoRequests() {
    console.log(`👁️  Watching for MementoRequested events on contract: ${CONTRACT_ADDRESS}`);
    
    try {
        // Listen for new events
        const unwatch = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESS,
            abi: MEMENTO_ABI,
            eventName: 'MementoRequested',
            onLogs: (logs) => {
                logs.forEach(async (log) => {
                    const { tokenId, creator, title, content, aiPrompt, timestamp } = log.args;
                    console.log(`📡 New MementoRequested event detected!`);
                    
                    // Process the request
                    await processMementoRequest(
                        Number(tokenId),
                        creator,
                        title,
                        content,
                        aiPrompt,
                        Number(timestamp)
                    );
                });
            }
        });

        console.log(`✅ Successfully watching for events. Press Ctrl+C to stop.`);
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping event watcher...');
            unwatch();
            process.exit(0);
        });
        
    } catch (error) {
        console.error(`❌ Error setting up event watcher:`, error);
        process.exit(1);
    }
}

// Check for existing pending mementos on startup
async function checkPendingMementos() {
    console.log(`🔍 Checking for existing pending mementos...`);
    
    try {
        const pendingTokens = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: MEMENTO_ABI,
            functionName: 'getPendingMementos',
        });
        
        console.log(`📋 Found ${pendingTokens.length} pending mementos`);
        
        // Process each pending memento
        for (const tokenId of pendingTokens) {
            try {
                const memento = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: MEMENTO_ABI,
                    functionName: 'getMemento',
                    args: [tokenId],
                });
                
                const [title, content, aiPrompt, creator, timestamp, isActive, imageUri, isGenerated] = memento;
                
                if (!isGenerated) {
                    console.log(`⏳ Processing pending memento ${tokenId}...`);
                    await processMementoRequest(
                        Number(tokenId),
                        creator,
                        title,
                        content,
                        aiPrompt,
                        Number(timestamp)
                    );
                }
            } catch (error) {
                console.error(`❌ Error processing pending memento ${tokenId}:`, error);
            }
        }
        
        console.log(`✅ Finished processing pending mementos\n`);
        
    } catch (error) {
        console.error(`❌ Error checking pending mementos:`, error);
    }
}

// Main function
async function main() {
    console.log(`🚀 Starting Memento AI Generator Backend`);
    console.log(`📡 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🌐 RPC URL: ${RPC_URL}`);
    console.log(`🐝 SWARM Gateway: ${SWARM_GATEWAY}`);
    console.log(`📦 SWARM Batch ID: ${SWARM_BATCH_ID}`);
    console.log(`🎨 OpenAI API Key: ${OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`🔑 Admin Account: ${account.address}\n`);
    
    // Check for pending mementos first
    await checkPendingMementos();
    
    // Start watching for new events
    await watchMementoRequests();
}

// Start the application
main().catch(console.error); 