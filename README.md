# MementoVol1 - NFT Memory Minting Platform

A full-stack NFT minting platform built with Hardhat 3, Next.js 15, and RainbowKit that allows users to mint their memories as unique NFTs on the blockchain.

This project uses Hardhat 3 Alpha, which is still in development and not yet intended for production use.

## Project Overview

This project includes:

- **Smart Contract**: MementoVol1.sol - ERC-721 NFT contract for minting memories
- **Frontend**: Next.js 15 app with RainbowKit wallet integration
- **Testing**: Comprehensive Solidity unit tests for the smart contract
- **Development**: Hardhat 3 configuration with deployment scripts
- **Styling**: Custom CSS (no frameworks) for clean, responsive design

## Features

- **NFT Minting**: Users can mint their memories as ERC-721 NFTs with custom metadata
- **Wallet Integration**: Seamless wallet connection using RainbowKit
- **Payment System**: Built-in mint pricing (0.001 ETH per NFT)
- **Responsive Design**: Clean, mobile-friendly interface
- **Comprehensive Testing**: Full test coverage for smart contract functionality

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

1. **Set your Sepolia testnet private key** (required for deployment):
   ```shell
   export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
   ```

2. **Set your Sepolia RPC URL** (get from Alchemy, Infura, etc.):
   ```shell
   export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
   ```

3. **Optional: Set mainnet variables for production**:
   ```shell
   export HARDHAT_VAR_MAINNET_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
   export HARDHAT_VAR_MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
   ```

4. **Optional: Set API keys for contract verification**:
   ```shell
   export HARDHAT_VAR_ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY_HERE"
   ```

**Making variables persistent (recommended):**

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.) to make them permanent:
```shell
# Add to ~/.zshrc or ~/.bashrc
export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="your_sepolia_private_key"
export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"
export HARDHAT_VAR_ETHERSCAN_API_KEY="your_etherscan_api_key"

# Then reload your shell
source ~/.zshrc  # or source ~/.bashrc
```

**Alternative: Use a separate shell script:**
```shell
# Create a file: scripts/env-vars.sh
#!/bin/bash
export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="your_private_key"
export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"
export HARDHAT_VAR_ETHERSCAN_API_KEY="your_etherscan_api_key"

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
export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="your_private_key"
export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"

# Test compilation
npm run hardhat:compile

# Deploy to Sepolia
npx hardhat run scripts/deploy-memento.ts --network sepolia
```

#### 2. Frontend Environment Variables (.env)

**For Next.js frontend only** - we still use `.env` for frontend configuration because these are public variables that need to be available in the browser.

Copy the environment template for Next.js configuration:
```shell
cp .env.example .env
```

Edit `.env` and fill in these **Next.js specific values**:
```env
# Frontend configuration only - these are safe to commit as examples
NEXT_PUBLIC_APP_NAME=MementoVol1
NEXT_PUBLIC_APP_DESCRIPTION=Mint your memories as unique NFTs
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia

# You need to get this from WalletConnect Cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Contract addresses (update after deployment)
NEXT_PUBLIC_MEMENTO_CONTRACT_SEPOLIA=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_MEMENTO_CONTRACT_MAINNET=0x1234567890123456789012345678901234567890
```

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

**Deploy to local network:**
```shell
npm run hardhat:node
# In another terminal:
npm run hardhat:deploy
```

**Deploy to Sepolia testnet:**
```shell
# Note: npx hardhat vars set commands are NOT available in Hardhat 3 Alpha
# Use environment variables instead:
export HARDHAT_VAR_SEPOLIA_PRIVATE_KEY="your_private_key"
export HARDHAT_VAR_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"

# Then deploy:
npx hardhat run scripts/deploy-memento.ts --network sepolia
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
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MementoVol1',
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
