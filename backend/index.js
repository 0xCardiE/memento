import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, createWriteStream } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Define Flow EVM chains
const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: { decimals: 18, name: 'Flow', symbol: 'FLOW' },
  rpcUrls: { default: { http: ['https://testnet.evm.nodes.onflow.org'] } },
  blockExplorers: { default: { name: 'Flow EVM Testnet Explorer', url: 'https://evm-testnet.flowscan.io' } },
});

const flowMainnet = defineChain({
  id: 747,
  name: 'Flow EVM Mainnet',
  nativeCurrency: { decimals: 18, name: 'Flow', symbol: 'FLOW' },
  rpcUrls: { default: { http: ['https://mainnet.evm.nodes.onflow.org'] } },
  blockExplorers: { default: { name: 'Flow EVM Mainnet Explorer', url: 'https://evm.flowscan.io' } },
});

// Contract ABI for the required functions
const MEMENTO_ABI = [
  {
    type: "event",
    name: "MementoRequested",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "content", type: "string", indexed: false },
      { name: "aiPrompt", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "function",
    name: "updateMementoUri",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_imageUri", type: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getPendingMementos",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view"
  }
];

// Environment variables
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = process.env.RPC_URL || "https://testnet.evm.nodes.onflow.org";
const SWARM_GATEWAY = process.env.SWARM_GATEWAY || "http://localhost:5555";
const NETWORK = process.env.NETWORK || "testnet"; // "testnet" or "mainnet"

// Validate required environment variables
if (!ADMIN_PRIVATE_KEY) {
  console.error("❌ ADMIN_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

// SWARM batch ID
const BATCH_ID = "c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278";

// Dynamic chain selection
const chain = NETWORK === "mainnet" ? flowMainnet : flowTestnet;

console.log("🚀 Starting Mement Machina Backend Service");
console.log("==========================================");
console.log(`📡 Network: ${chain.name}`);
console.log(`⛓️  Chain ID: ${chain.id}`);
console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
console.log(`🌐 SWARM Gateway: ${SWARM_GATEWAY}`);

// Create clients
const account = privateKeyToAccount(ADMIN_PRIVATE_KEY);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

console.log(`👤 Admin Address: ${account.address}`);

// Call OpenAI DALL-E 3 API
async function generateImage(prompt, size, apiKey) {
  console.log(`🎨 Generating image with OpenAI DALL-E 3...`);
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    console.log(`✅ Image generated successfully`);
    return imageUrl;
    
  } catch (error) {
    console.error(`❌ OpenAI API error:`, error.message);
    throw error;
  }
}

// Download image from URL
async function downloadImage(url) {
  console.log(`📥 Downloading image from OpenAI...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    console.log(`✅ Image downloaded (${buffer.length} bytes)`);
    return buffer;
    
  } catch (error) {
    console.error(`❌ Download error:`, error.message);
    throw error;
  }
}

// Upload image to SWARM
async function uploadToSwarm(imageBuffer, filename) {
  console.log(`🌐 Uploading to SWARM network...`);
  
  try {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: filename,
      contentType: 'image/png'
    });

    const uploadUrl = `${SWARM_GATEWAY}/bzz?name=${filename}`;
    console.log(`📤 Upload URL: ${uploadUrl}`);
    console.log(`🆔 Batch ID: ${BATCH_ID}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      headers: {
        'Swarm-Postage-Batch-Id': BATCH_ID,
        ...form.getHeaders()
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const swarmHash = result.reference;
    const bzz_link = `https://bzz.link/bzz/${swarmHash}`;
    
    console.log(`✅ Image uploaded to SWARM`);
    console.log(`🔗 SWARM Hash: ${swarmHash}`);
    console.log(`🌐 BZZ Link: ${bzz_link}`);
    
    return bzz_link;
    
  } catch (error) {
    console.error(`❌ SWARM upload error:`, error.message);
    throw error;
  }
}

// Update NFT URI in contract
async function updateNftUri(tokenId, imageUri) {
  console.log(`🔄 Updating NFT ${tokenId} with image URI...`);
  
  try {
    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MEMENTO_ABI,
      functionName: 'updateMementoUri',
      args: [BigInt(tokenId), imageUri],
      account: account.address,
    });

    const hash = await walletClient.writeContract(request);
    console.log(`📝 Transaction sent: ${hash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ NFT ${tokenId} updated successfully`);
    console.log(`🔗 Transaction: ${chain.blockExplorers.default.url}/tx/${hash}`);
    
    return receipt;
    
  } catch (error) {
    console.error(`❌ Contract update error:`, error.message);
    throw error;
  }
}

// Process a memento request
async function processMemento(tokenId, creator, title, content, aiPromptJson, timestamp) {
  console.log(`\n🎯 Processing Memento ${tokenId}`);
  console.log(`👤 Creator: ${creator}`);
  console.log(`📝 Title: ${title}`);
  
  try {
    // Parse the AI prompt JSON data
    let promptData;
    try {
      promptData = JSON.parse(aiPromptJson);
    } catch (parseError) {
      console.error(`❌ Failed to parse AI prompt JSON:`, parseError.message);
      console.log(`📄 Raw AI prompt:`, aiPromptJson);
      return;
    }

    const { prompt, colors, variations, size, apiKey } = promptData;
    
    if (!prompt || !apiKey) {
      console.error(`❌ Missing required fields in prompt data`);
      console.log(`📄 Parsed data:`, promptData);
      return;
    }

    console.log(`🎨 Colors: ${colors}`);
    if (variations) {
      console.log(`✨ Variations: ${variations}`);
    }
    console.log(`📐 Size: ${size}`);

    // Step 1: Generate image with OpenAI DALL-E 3
    const imageUrl = await generateImage(prompt, size, apiKey);
    
    // Step 2: Download the image
    const imageBuffer = await downloadImage(imageUrl);
    
    // Step 3: Upload to SWARM
    const filename = `memento-${tokenId}-${Date.now()}.png`;
    const bzzLink = await uploadToSwarm(imageBuffer, filename);
    
    // Step 4: Update NFT URI in contract
    await updateNftUri(tokenId, bzzLink);
    
    console.log(`🎉 Memento ${tokenId} processed successfully!`);
    console.log(`🖼️  Final Image: ${bzzLink}`);
    
  } catch (error) {
    console.error(`❌ Error processing memento ${tokenId}:`, error.message);
    
    // Could implement retry logic here
    console.log(`⏳ Will retry on next startup...`);
  }
}

// Process pending mementos from previous runs
async function processPendingMementos() {
  console.log(`\n🔍 Checking for pending mementos...`);
  
  try {
    const pendingTokens = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MEMENTO_ABI,
      functionName: 'getPendingMementos',
    });

    if (pendingTokens.length === 0) {
      console.log(`✅ No pending mementos found`);
      return;
    }

    console.log(`📋 Found ${pendingTokens.length} pending memento(s): ${pendingTokens.join(', ')}`);
    
    // Note: For simplicity, we're not processing old pending mementos automatically
    // since they don't contain the OpenAI API key. This could be enhanced to 
    // use a fallback API key from environment variables if needed.
    console.log(`⚠️  Pending mementos require manual processing or will be processed on new events`);
    
  } catch (error) {
    console.error(`❌ Error checking pending mementos:`, error.message);
  }
}

// Set up event listener
async function startEventListener() {
  console.log(`\n👂 Setting up event listener for MementoRequested events...`);
  
  try {
    // Process any existing pending mementos
    await processPendingMementos();
    
    console.log(`✅ Event listener started successfully`);
    console.log(`⏳ Waiting for new memento requests...\n`);

    // Watch for MementoRequested events
    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: MEMENTO_ABI,
      eventName: 'MementoRequested',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { tokenId, creator, title, content, aiPrompt, timestamp } = log.args;
          console.log(`🔔 New MementoRequested event received!`);
          
          // Process the memento asynchronously
          processMemento(
            Number(tokenId), 
            creator, 
            title, 
            content, 
            aiPrompt, 
            Number(timestamp)
          );
        });
      },
      onError: (error) => {
        console.error(`❌ Event listener error:`, error.message);
        console.log(`🔄 Restarting event listener in 10 seconds...`);
        setTimeout(() => {
          startEventListener();
        }, 10000);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n🛑 Shutting down gracefully...`);
      unwatch();
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Failed to start event listener:`, error.message);
    console.log(`🔄 Retrying in 30 seconds...`);
    setTimeout(startEventListener, 30000);
  }
}

// Start the service
startEventListener(); 