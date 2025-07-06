import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
const rootDir = join(__dirname, '..');
dotenv.config({ path: join(rootDir, '.env') });

// Network configurations
const NETWORKS = {
  testnet: {
    name: "Flow EVM Testnet",
    url: "https://testnet.evm.nodes.onflow.org",
    chainId: 545,
    privateKeyEnv: "HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY",
    contractAddressEnv: "CONTRACT_ADDRESS_TESTNET",
    currency: "FLOW",
    explorer: "https://evm-testnet.flowscan.io"
  },
  mainnet: {
    name: "Flow EVM Mainnet", 
    url: "https://mainnet.evm.nodes.onflow.org",
    chainId: 747,
    privateKeyEnv: "HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY",
    contractAddressEnv: "CONTRACT_ADDRESS_MAINNET",
    currency: "FLOW",
    explorer: "https://evm.flowscan.io"
  }
};

async function main() {
  console.log("💰 Memento Machina - Withdrawal Script");
  console.log("=====================================");
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let network = "mainnet"; // Default to mainnet
  
  if (args.length > 0) {
    network = args[0].toLowerCase();
  }
  
  // Validate network
  if (!NETWORKS[network]) {
    console.error(`❌ Invalid network: ${network}`);
    console.error(`✅ Available networks: ${Object.keys(NETWORKS).join(', ')}`);
    console.error(`💡 Usage: npm run withdraw [testnet|mainnet]`);
    console.error(`📝 Default: mainnet`);
    return;
  }
  
  await withdrawFromMementoContract(network);
}

async function withdrawFromMementoContract(networkName) {
  const networkConfig = NETWORKS[networkName];
  
  console.log(`🔄 Withdrawing from MementoVol1 on ${networkConfig.name}`);
  console.log(`💱 Currency: ${networkConfig.currency}`);
  
  // Get private key from environment
  const privateKey = process.env[networkConfig.privateKeyEnv];
  if (!privateKey || privateKey.includes('your_') || privateKey.includes('_here')) {
    console.error(`❌ Missing or invalid private key environment variable: ${networkConfig.privateKeyEnv}`);
    console.error(`💡 Edit .env file and set: ${networkConfig.privateKeyEnv}="your_actual_private_key"`);
    console.error(`📝 Current value: ${privateKey ? privateKey.substring(0, 10) + '...' : 'undefined'}`);
    return;
  }
  
  // Get contract address from environment
  const contractAddress = process.env[networkConfig.contractAddressEnv];
  if (!contractAddress || contractAddress.includes('your_') || contractAddress.includes('_here')) {
    console.error(`❌ Missing or invalid contract address environment variable: ${networkConfig.contractAddressEnv}`);
    console.error(`💡 Edit .env file and set: ${networkConfig.contractAddressEnv}="your_actual_contract_address"`);
    console.error(`📝 Current value: ${contractAddress || 'undefined'}`);
    return;
  }
  
  if (!ethers.isAddress(contractAddress)) {
    console.error(`❌ Invalid contract address: ${contractAddress}`);
    return;
  }
  
  console.log(`📍 Contract: ${contractAddress}`);
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(networkConfig.url);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 Withdrawing to: ${wallet.address}`);
  
  // Check wallet balance
  const walletBalance = await provider.getBalance(wallet.address);
  console.log(`💰 Current wallet balance: ${ethers.formatEther(walletBalance)} ${networkConfig.currency}`);
  
  // Read contract ABI
  const contractPath = join(__dirname, '../artifacts/contracts/MementoVol1.sol/MementoVol1.json');
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
  
  // Execute withdrawal
  console.log(`💸 Withdrawing all funds (${ethers.formatEther(contractBalance)} ${networkConfig.currency})`);
  
  let tx;
  try {
    tx = await contract.withdraw();
  } catch (error) {
    console.error(`❌ Withdrawal failed: ${error.message}`);
    return;
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 