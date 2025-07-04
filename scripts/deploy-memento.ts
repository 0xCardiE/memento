import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

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

async function main() {
  console.log("🚀 Deploying Mement Machina - Vol 1 Contract to Flow EVM");
  console.log("=========================================");

  // Get network argument
  const network = process.env.HARDHAT_NETWORK || "flowTestnet";
  console.log(`📡 Network: ${network}`);

  // Get private key
  const privateKey = process.env.HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY environment variable is required");
  }

  // Determine chain
  const chain = network === "flowMainnet" ? flowMainnet : flowTestnet;
  console.log(`⛓️  Chain ID: ${chain.id} (${chain.name})`);

  // Create account and clients
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`👤 Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  // Check balance
  const balance = await publicClient.getBalance({
    address: account.address,
  });
  console.log(`💰 Balance: ${Number(balance) / 1e18} FLOW`);

  if (balance === BigInt(0)) {
    console.log("❌ Insufficient balance. Get testnet FLOW from: https://testnet-faucet.onflow.org/");
    return;
  }

  // Contract bytecode and ABI (you'll need to get this from compilation)
  console.log("📝 Deploying MementoVol1 contract...");
  
  // For now, we'll use a placeholder since we need the actual bytecode
  console.log("✅ Contract ready for deployment!");
  console.log("🔧 Note: You need to add the actual contract bytecode to complete deployment");
  console.log(`🌐 Explorer: ${chain.blockExplorers.default.url}`);
  console.log("💰 Get testnet FLOW: https://testnet-faucet.onflow.org/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 