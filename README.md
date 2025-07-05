# Memento Machina - Geological Pattern NFT Generator

A full-stack NFT minting platform built with Flow, Hardhat 3, and Swarm that allows users to create beautiful layered rock formation patterns as unique NFTs with AI-generated artwork stored on decentralized storage.

## 🛠️ Built With

<div align="center">
  
[![Flow](https://img.shields.io/badge/Flow-00EF8B?style=for-the-badge&logo=flow&logoColor=white)](https://flow.com)
[![Hardhat](https://img.shields.io/badge/Hardhat-FFF04D?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org)
[![Swarm](https://img.shields.io/badge/Swarm-FF6B35?style=for-the-badge&logo=ethereum&logoColor=white)](https://www.ethswarm.org)

</div>

- **[Flow](https://flow.com)** - EVM-compatible blockchain with native features and sponsored transactions
- **[Hardhat 3](https://hardhat.org)** - Ethereum development environment for smart contract deployment and testing
- **[Swarm](https://www.ethswarm.org)** - Decentralized storage network for storing AI-generated NFT artwork

This project uses Hardhat 3 Alpha, which is still in development and not yet intended for production use.

## Project Overview

This project includes:

- **Smart Contract**: MementoVol1.sol - ERC-721 NFT contract deployed on Flow EVM
- **AI Generation**: OpenAI DALL-E 3 integration for creating unique artwork
- **Decentralized Storage**: Swarm network for storing AI-generated images
- **Backend Service**: Event-driven AI generation and NFT URI updates
- **Frontend**: Next.js 15 app with Flow EVM wallet integration
- **Testing**: Comprehensive Solidity unit tests for the smart contract
- **Development**: Hardhat 3 configuration with Flow EVM deployment scripts

## Features

- **AI-Generated NFTs**: Users submit geological pattern prompts, AI creates unique artwork
- **Pay-First System**: Payment before AI generation ensures guaranteed processing
- **Flow EVM Integration**: Deployed on Flow blockchain with sponsored transactions
- **Swarm Storage**: Decentralized storage for permanent artwork hosting
- **Event-Driven Processing**: Automated backend processes NFT generation requests
- **Multi-Network Support**: Works on both Flow EVM testnet and mainnet
- **Real-time Updates**: NFT URIs automatically updated with final artwork URLs
- **Permanent Storage**: Swarm Vault on Gnosis Chain ensures long-term accessibility
- **Community Funding**: Public contributions extend storage duration
- **Transparent Operations**: All transactions and contributions visible on-chain

## 💎 Collection Details

### Pricing & Supply
- **Collection Size**: 1,000 unique NFTs maximum
- **Early Bird Price**: 3.33 FLOW (first 200 mints)
- **Regular Price**: 6.66 FLOW (mints 201-1000)
- **Minting Duration**: 7 days from contract deployment
- **Blockchain**: Flow EVM (Testnet: 545, Mainnet: 747)

### Artwork Characteristics
- **Style**: Geological strata patterns with irregular, wavy boundaries
- **AI Model**: OpenAI DALL-E 3 (1024x1024 resolution)
- **Personalization**: User's color palette and thoughts influence the generation
- **Base Theme**: Sedimentary rock formations, canyon walls, mineral deposits
- **Uniqueness**: Each NFT is generated from user's personal input

### Technical Specifications
- **Standard**: ERC-721 (Non-Fungible Token)
- **Metadata**: Stored on Swarm decentralized network
- **Images**: Permanent storage via Swarm postage stamp system
- **Smart Contract**: Verified on Flow EVM block explorer
- **Backend**: Node.js service with real-time event processing

## 🏗️ System Architecture

The Memento Machina platform consists of **five main components** that work together to create AI-generated NFTs with permanent storage:

### Component Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │    │                 │
│   Frontend      │    │  Smart Contract │    │  Backend Service│    │  SWARM Network  │    │  Swarm Vault    │
│   (Next.js)     │    │   (Flow EVM)    │    │   (Node.js)     │    │ (Decentralized) │    │ (Gnosis Chain)  │
│                 │    │                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

**1. NFT Minting Process:**
```
User → Frontend → Smart Contract → Event Emission
                      ↓
                 Backend Listens → OpenAI DALL-E → SWARM Storage → Update NFT Metadata
```

**2. Component Interactions:**

#### 🖥️ **Frontend (Next.js App)**
- **Role**: User interface and wallet integration
- **Interactions**: 
  - **WITH Smart Contract**: Direct blockchain transactions (minting, reading data)
  - **NOT WITH**: SWARM network (never directly communicates)
- **Technology**: Next.js 15, RainbowKit, Wagmi, Flow EVM
- **Deployment**: Static export to CDN/hosting service

#### 📄 **Smart Contract (Flow EVM)**
- **Role**: NFT management and event coordination
- **Functions**:
  - Accepts mint payments (6.66 FLOW)
  - Emits `MementoRequested` events with user prompts
  - Stores NFT metadata URLs (updated by backend)
  - Handles standard ERC-721 functionality
- **Networks**: Flow EVM Testnet (545) and Mainnet (747)

#### 🤖 **Backend Service (Node.js)**
- **Role**: AI generation and SWARM storage orchestration
- **Process Flow**:
  1. **Listens** to `MementoRequested` events from smart contract
  2. **Generates** AI images using OpenAI DALL-E 3
  3. **Stores** images and metadata on SWARM network
  4. **Updates** NFT metadata URI in smart contract
- **Deployment**: Server with Node.js runtime
- **Port**: Configurable (typically 3001 or 8080)
- **Requirements**: Access to SWARM node (local or remote gateway)

#### 🌐 **SWARM Network**
- **Role**: Decentralized storage for images and metadata
- **Communication**: 
  - **WITH Backend**: HTTP API calls to SWARM gateway
  - **NOT WITH**: Frontend (no direct interaction)
- **Storage**: Permanent, content-addressed storage
- **Access**: Via SWARM gateways or local SWARM nodes

#### 🏦 **Swarm Vault (Gnosis Chain)**
- **Role**: Permanent funding mechanism for Swarm storage
- **Functions**:
  - Manages postage stamp funding to ensure long-term storage
  - Accepts contributions from Flow EVM bridge or direct deposits
  - Automatically tops up postage stamp when balance gets low
  - Allows public contributions to extend storage duration
  - Transparent tracking of all contributions and expenditures
- **Contract**: `SwarmVault.sol` deployed on Gnosis Chain
- **Target**: Swarm PostageStamp contract at `0x45a1502382541Cd610CC9068e88727426b696293`

### Backend Service Details

The backend service is a **standalone Node.js application** that:

**Runs independently** from the frontend:
- Deployed on a server (can be same or different from frontend)
- Listens on a specific port for API calls (if needed)
- Communicates with SWARM node via HTTP API

**SWARM Node Configuration**:
- **Option 1**: Local SWARM node running on same server
- **Option 2**: Remote SWARM gateway (e.g., `https://gateway.ethswarm.org`)
- **Configuration**: Set via `SWARM_GATEWAY` environment variable

**Event-Driven Processing**:
```javascript
// Backend listens to blockchain events
contract.on('MementoRequested', async (tokenId, user, title, content, aiPrompt) => {
  // 1. Generate AI image with OpenAI
  const imageUrl = await generateImage(aiPrompt);
  
  // 2. Store image on SWARM
  const swarmUrl = await storeOnSwarm(imageBuffer);
  
  // 3. Update NFT metadata in smart contract
  await contract.updateMementoUri(tokenId, metadataUrl);
});
```

### Key Architectural Benefits

**🔒 Security**: Frontend never handles private keys for SWARM or AI services
**⚡ Performance**: AI generation happens asynchronously, doesn't block user interface
**🌍 Decentralization**: Images stored on SWARM, not centralized servers
**🔄 Reliability**: Event-driven system ensures no lost mint requests
**📱 User Experience**: Users get immediate NFT, artwork appears when ready

### Deployment Architecture

**Production Setup**:
```
CDN/Vercel (Frontend) → Flow EVM (Smart Contract) ← VPS/Server (Backend + SWARM)
```

**Local Development**:
```
localhost:3000 (Frontend) → Flow Testnet (Smart Contract) ← localhost:3001 (Backend)
```

The backend service runs **continuously** and processes NFT generation requests as they come in from the blockchain events.

## 🏦 Swarm Vault - Permanent Storage Funding

To ensure the NFT artwork remains permanently accessible, we've implemented a **Swarm Vault** system on Gnosis Chain:

### How It Works

1. **Funding Sources**:
   - Bridge funds from Flow EVM to Gnosis Chain
   - Direct xDAI deposits by community members
   - Automatic contributions from NFT sales (future feature)

2. **Automatic Management**:
   - Monitors postage stamp balance automatically
   - Tops up when balance falls below threshold (0.1 xDAI)
   - Extends storage duration to ensure permanent access

3. **Community Contributions**:
   - Anyone can contribute xDAI to extend storage
   - Transparent tracking of all contributions
   - Public dashboard showing vault statistics

### Technical Details

- **Contract**: `SwarmVault.sol` deployed on Gnosis Chain
- **Postage Stamp**: `0x45a1502382541Cd610CC9068e88727426b696293`
- **Batch ID**: `c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278`
- **Auto Top-up**: 0.5 xDAI when balance < 0.1 xDAI
- **Transparency**: All contributions and expenditures logged on-chain

### Key Features

- **Automated**: No manual intervention required
- **Transparent**: All transactions visible on Gnosis Chain
- **Community-Driven**: Anyone can contribute to extend storage
- **Fail-Safe**: Emergency withdrawal for contract owner
- **Cost-Effective**: Uses cheap Gnosis Chain gas fees

### Bridge Setup

To fund the vault from Flow EVM:
1. Use Flow <-> Gnosis bridge (when available)
2. Or manually bridge Flow -> Ethereum -> Gnosis
3. Send xDAI directly to the SwarmVault contract

This system ensures that all Memento Machina NFT artwork will remain permanently accessible, creating a true time capsule that can survive for decades.

## Setup

### Configuration Variables

This project uses a **hybrid approach** for configuration:

1. **Hardhat Configuration Variables** - For smart contract deployment (private keys, RPC URLs, API keys)
2. **Environment Variables (.env)** - For Next.js frontend configuration

> **🔥 Important**: We **do NOT use .env files for Hardhat 3** configuration. Hardhat 3 Alpha uses [configuration variables](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables) with environment variables prefixed with `HARDHAT_VAR_`, which is more secure and prevents accidentally committing sensitive data to git repositories.

#### 1. Hardhat Configuration Variables

**⚠️ Important: Hardhat 3 Alpha Limitation**

The [official Hardhat documentation](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables) shows that the preferred way to set configuration variables is:

```shell
# This should work in stable Hardhat:
npx hardhat vars set SEPOLIA_PRIVATE_KEY
npx hardhat vars get SEPOLIA_PRIVATE_KEY
```

However, **these commands are NOT available in Hardhat 3 Alpha (3.0.0-next.21)**:
```shell
npx hardhat vars list
# Error HHE404: Task "vars" not found
```

**Current Alpha Workaround:** Use `HARDHAT_VAR_*` environment variables instead.

**Why we use Hardhat's configuration variables instead of .env:**
- ✅ **More Secure**: Variables are loaded from environment, never stored in project files
- ✅ **No Git Accidents**: Impossible to accidentally commit private keys to version control  
- ✅ **Environment Override**: Uses standard environment variable approach with `HARDHAT_VAR_` prefix
- ✅ **Built-in**: No need for additional packages like `dotenv`
- ✅ **Flexible**: Can be set per-session or globally in your shell

**Check what variables you need to set:**
```shell
npm run setup-hardhat
```

**Step-by-step setup example:**

1. **Set your Flow EVM testnet private key** (required for deployment):
   ```shell
   export HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
   ```

2. **Optional: Set mainnet variables for production**:
   ```shell
   export HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
   ```

**Flow EVM Network Information:**
- **Testnet**: `https://testnet.evm.nodes.onflow.org` (Chain ID: 545)
- **Mainnet**: `https://mainnet.evm.nodes.onflow.org` (Chain ID: 747)
- **Block Explorer**: [Flow EVM Explorer](https://evm.flowscan.io)

**Making variables persistent (recommended):**

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.) to make them permanent:
```shell
# Add to ~/.zshrc or ~/.bashrc
export HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY="your_flow_testnet_private_key"
export HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY="your_flow_mainnet_private_key"

# Then reload your shell
source ~/.zshrc  # or source ~/.bashrc
```

**Alternative: Use a separate shell script:**
```shell
# Create a file: scripts/env-vars.sh
#!/bin/bash
export HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY="your_private_key"
export HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY="your_private_key"

# Source it before running hardhat commands
source scripts/env-vars.sh
npx hardhat compile
```

**📋 Quick Start: Use the provided example script:**
```shell
# Copy and modify the example script
cp scripts/env-vars-example.sh scripts/my-env-vars.sh
# Edit scripts/my-env-vars.sh with your real values
# Then source it:
source scripts/my-env-vars.sh
```

**Example: Complete setup flow**
```shell
# Set required variables
export HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY="your_private_key"

# Test compilation
npm run hardhat:compile

# Deploy to Flow EVM Testnet
npx hardhat run scripts/deploy-memento.ts --network flowTestnet
```

#### 2. Frontend Environment Variables (.env)

**For Next.js frontend only** - we use `.env` for frontend configuration because these are public variables that need to be available in the browser.

Copy the environment template:
```shell
cp .env.example .env
```

Edit `.env` and update these values:
```env
# App Configuration
NEXT_PUBLIC_APP_NAME=Mement Machina - Vol 1
NEXT_PUBLIC_APP_DESCRIPTION=Mint your memories as unique NFTs on Flow EVM

# WalletConnect Project ID - Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Flow EVM Contract Addresses (update after deployment)
NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_MAINNET=
```

**Required Setup:**
1. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Update contract addresses after deployment to Flow EVM networks

**Check your .env configuration:**
```shell
npm run check-env
```

#### 3. Important Security Notes

- **Hardhat variables** use standard environment variables with `HARDHAT_VAR_` prefix
- **Never commit private keys** to version control
- **Environment variables** in `.env` are for frontend configuration only (public data)
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Consider using shell profiles or separate scripts to manage sensitive environment variables

## Usage

### Flow EVM Development

**Flow EVM Faucet**: Get testnet FLOW tokens from the [Flow Faucet](https://testnet-faucet.onflow.org/) for testing your contracts.

**Contract Verification**: Your contracts can be verified on Flowscan block explorers:
- **Testnet**: https://evm-testnet.flowscan.io/
- **Mainnet**: https://evm.flowscan.io/

**Additional Dependencies for Flow EVM** (optional):
```shell
# For OpenZeppelin contracts (if using)
npm install @openzeppelin/contracts

# For contract upgrades (if needed)
npm install @openzeppelin/hardhat-upgrades
```

### Smart Contract Development

**Check Hardhat configuration:**
```shell
npm run setup-hardhat
```

**Compile contracts:**
```shell
npm run hardhat:compile
```

**Run tests:**
```shell
npm run hardhat:test
```

**Deploy to Flow EVM Testnet:**
```shell
# Set your private key
export HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY="your_private_key"

# Deploy
npx hardhat run scripts/deploy-memento.ts --network flowTestnet
```

**Deploy to Flow EVM Mainnet:**
```shell
# Set your private key
export HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY="your_private_key"

# Deploy
npx hardhat run scripts/deploy-memento.ts --network flowMainnet
```

**Verify contracts** (after deployment):
```shell
# Testnet
npx hardhat verify --network flowTestnet <contract_address>

# Mainnet  
npx hardhat verify --network flowMainnet <contract_address>
```

### Frontend Development

**Start the development server:**
```shell
npm run dev
```

The frontend will be available at `http://localhost:3000`

**Build for production:**
```shell
npm run build
```

### Other Commands

- `npm run format` - Format code with Prettier
- `npm run check-env` - Check frontend environment variables
- `npm run setup-hardhat` - Check Hardhat configuration variables

## Configuration Files

### Hardhat Configuration (`hardhat.config.ts`)

The Hardhat configuration uses `configVariable()` to securely load deployment variables:

```typescript
networks: {
  sepolia: {
    type: "http",
    chainType: "l1",
    url: configVariable("SEPOLIA_RPC_URL"),
    accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
  },
  // ... other networks
}
```

### Frontend Configuration (`lib/wagmi.ts`)

The frontend configuration uses environment variables for public settings:

```typescript
export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Mement Machina - Vol 1',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [hardhat, sepolia, mainnet],
  ssr: true,
})
```

## Project Structure

```
├── contracts/          # Smart contracts
│   └── MementoVol1.sol # Main NFT contract
├── test/               # Contract tests
│   └── MementoVol1.t.sol # Solidity tests
├── scripts/            # Deployment and utility scripts
│   ├── deploy-memento.ts
│   ├── setup-hardhat-vars.cjs
│   └── check-env.cjs
├── app/                # Next.js frontend
├── components/         # React components
├── lib/                # Wagmi/Web3 configuration
├── .env.example        # Frontend environment template
└── hardhat.config.ts   # Hardhat configuration
```

## Getting API Keys

- **Alchemy**: [https://www.alchemy.com/](https://www.alchemy.com/)
- **Infura**: [https://infura.io/](https://infura.io/)
- **WalletConnect**: [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
- **Etherscan**: [https://etherscan.io/apis](https://etherscan.io/apis)

## Why This Hybrid Approach?

1. **Security**: Hardhat variables use standard environment variables with `HARDHAT_VAR_` prefix
2. **Convenience**: Frontend variables in `.env` are easy to manage for development
3. **Best Practices**: Follows Hardhat 3 recommendations for configuration management
4. **Flexibility**: Easy to override Hardhat variables with environment variables if needed

For more information about Hardhat configuration variables, see the [official documentation](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables).
