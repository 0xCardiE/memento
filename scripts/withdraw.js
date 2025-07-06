import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Network configurations
const NETWORKS = {
  flowTestnet: {
    name: "Flow EVM Testnet",
    url: "https://testnet.evm.nodes.onflow.org",
    chainId: 545,
    privateKeyEnv: "HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY",
    currency: "FLOW",
    explorer: "https://evm-testnet.flowscan.io"
  },
  flowMainnet: {
    name: "Flow EVM Mainnet", 
    url: "https://mainnet.evm.nodes.onflow.org",
    chainId: 747,
    privateKeyEnv: "HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY",
    currency: "FLOW",
    explorer: "https://evm.flowscan.io"
  },
  gnosis: {
    name: "Gnosis Chain",
    url: "https://rpc.gnosischain.com",
    chainId: 100,
    privateKeyEnv: "HARDHAT_VAR_GNOSIS_PRIVATE_KEY",
    currency: "xDAI",
    explorer: "https://gnosisscan.io"
  }
};

// Contract configurations
const CONTRACTS = {
  mementoVol1: {
    name: "MementoVol1",
    artifactPath: "contracts/MementoVol1.sol/MementoVol1.json",
    withdrawFunction: "withdraw", // No parameters - withdraws all
    networks: ["flowTestnet", "flowMainnet"]
  },
  swarmVault: {
    name: "SwarmVault", 
    artifactPath: "contracts/SwarmVault.sol/SwarmVault.json",
    withdrawFunction: "emergencyWithdraw", // Takes amount parameter (0 = all)
    networks: ["gnosis"]
  }
};

async function main() {
  console.log("💰 Memento Machina - Withdrawal Script");
  console.log("=====================================");
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showUsage();
    return;
  }
  
  const contractName = args[0];
  const network = args[1];
  const contractAddress = args[2];
  const amount = args[3]; // Optional - for SwarmVault only
  
  // Validate inputs
  if (!CONTRACTS[contractName]) {
    console.error(`❌ Invalid contract name. Available: ${Object.keys(CONTRACTS).join(', ')}`);
    return;
  }
  
  if (!NETWORKS[network]) {
    console.error(`❌ Invalid network. Available: ${Object.keys(NETWORKS).join(', ')}`);
    return;
  }
  
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    console.error(`❌ Invalid contract address: ${contractAddress}`);
    return;
  }
  
  // Check if contract supports this network
  const contractConfig = CONTRACTS[contractName];
  if (!contractConfig.networks.includes(network)) {
    console.error(`❌ ${contractConfig.name} is not deployed on ${network}`);
    console.error(`✅ Available networks for ${contractConfig.name}: ${contractConfig.networks.join(', ')}`);
    return;
  }
  
  await withdrawFromContract(contractName, network, contractAddress, amount);
}

async function withdrawFromContract(contractName, networkName, contractAddress, amount) {
  const contractConfig = CONTRACTS[contractName];
  const networkConfig = NETWORKS[networkName];
  
  console.log(`🔄 Withdrawing from ${contractConfig.name} on ${networkConfig.name}`);
  console.log(`📍 Contract: ${contractAddress}`);
  console.log(`💱 Currency: ${networkConfig.currency}`);
  
  // Get private key
  const privateKey = process.env[networkConfig.privateKeyEnv];
  if (!privateKey) {
    throw new Error(`❌ ${networkConfig.privateKeyEnv} environment variable is required`);
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(networkConfig.url);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 Withdrawing to: ${wallet.address}`);
  
  // Check wallet balance
  const walletBalance = await provider.getBalance(wallet.address);
  console.log(`💰 Current wallet balance: ${ethers.formatEther(walletBalance)} ${networkConfig.currency}`);
  
  // Read contract ABI
  const contractPath = join(__dirname, '../artifacts/', contractConfig.artifactPath);
  const contractJson = JSON.parse(readFileSync(contractPath, 'utf8'));
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  // Check contract balance
  const contractBalance = await provider.getBalance(contractAddress);
  console.log(`📊 Contract balance: ${ethers.formatEther(contractBalance)} ${networkConfig.currency}`);
  
  if (contractBalance === 0n) {
    console.log("⚠️  Contract has no funds to withdraw");
    return;
  }
  
  // Verify ownership
  try {
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error(`❌ Access denied. Contract owner: ${owner}, Your address: ${wallet.address}`);
      return;
    }
    console.log("✅ Ownership verified");
  } catch (error) {
    console.error(`❌ Could not verify ownership: ${error.message}`);
    return;
  }
  
  // Prepare withdrawal
  let withdrawAmount = contractBalance;
  let tx;
  
  if (contractConfig.withdrawFunction === "withdraw") {
    // MementoVol1 - withdraws all funds
    console.log(`💸 Withdrawing all funds (${ethers.formatEther(contractBalance)} ${networkConfig.currency})`);
    
    try {
      tx = await contract.withdraw();
    } catch (error) {
      console.error(`❌ Withdrawal failed: ${error.message}`);
      return;
    }
    
  } else if (contractConfig.withdrawFunction === "emergencyWithdraw") {
    // SwarmVault - can specify amount
    if (amount && amount !== "0" && amount !== "all") {
      withdrawAmount = ethers.parseEther(amount);
      if (withdrawAmount > contractBalance) {
        console.error(`❌ Requested amount (${amount}) exceeds contract balance (${ethers.formatEther(contractBalance)})`);
        return;
      }
      console.log(`💸 Withdrawing ${amount} ${networkConfig.currency}`);
    } else {
      console.log(`💸 Withdrawing all funds (${ethers.formatEther(contractBalance)} ${networkConfig.currency})`);
      withdrawAmount = 0n; // 0 means withdraw all for SwarmVault
    }
    
    try {
      tx = await contract.emergencyWithdraw(withdrawAmount);
    } catch (error) {
      console.error(`❌ Emergency withdrawal failed: ${error.message}`);
      return;
    }
  }
  
  console.log(`⏳ Transaction submitted: ${tx.hash}`);
  console.log(`🔗 View on explorer: ${networkConfig.explorer}/tx/${tx.hash}`);
  
  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("✅ Withdrawal successful!");
    console.log(`📄 Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`⛽ Gas price: ${ethers.formatUnits(receipt.gasPrice || 0, "gwei")} gwei`);
    
    // Check new balances
    const newContractBalance = await provider.getBalance(contractAddress);
    const newWalletBalance = await provider.getBalance(wallet.address);
    
    console.log(`📊 New contract balance: ${ethers.formatEther(newContractBalance)} ${networkConfig.currency}`);
    console.log(`💰 New wallet balance: ${ethers.formatEther(newWalletBalance)} ${networkConfig.currency}`);
    
    const withdrawn = contractBalance - newContractBalance;
    console.log(`💸 Total withdrawn: ${ethers.formatEther(withdrawn)} ${networkConfig.currency}`);
    
  } else {
    console.error("❌ Transaction failed");
  }
}

function showUsage() {
  console.log("Usage: npm run withdraw <contract> <network> <address> [amount]");
  console.log("");
  console.log("Contracts:");
  console.log("  mementoVol1  - Memento Vol1 NFT contract (withdraws all funds)");
  console.log("  swarmVault   - Swarm Vault contract (can specify amount)");
  console.log("");
  console.log("Networks:");
  console.log("  flowTestnet  - Flow EVM Testnet");
  console.log("  flowMainnet  - Flow EVM Mainnet");
  console.log("  gnosis       - Gnosis Chain");
  console.log("");
  console.log("Examples:");
  console.log("  # Withdraw all funds from MementoVol1 on Flow Testnet");
  console.log("  npm run withdraw mementoVol1 flowTestnet 0x1234567890123456789012345678901234567890");
  console.log("");
  console.log("  # Withdraw all funds from SwarmVault on Gnosis");
  console.log("  npm run withdraw swarmVault gnosis 0x1234567890123456789012345678901234567890");
  console.log("");
  console.log("  # Withdraw 0.5 xDAI from SwarmVault on Gnosis");
  console.log("  npm run withdraw swarmVault gnosis 0x1234567890123456789012345678901234567890 0.5");
  console.log("");
  console.log("Environment Variables Required:");
  console.log("  HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY  - For Flow Testnet");
  console.log("  HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY  - For Flow Mainnet");
  console.log("  HARDHAT_VAR_GNOSIS_PRIVATE_KEY        - For Gnosis Chain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 