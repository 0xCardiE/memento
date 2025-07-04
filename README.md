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

## Usage

### Frontend Development

Start the Next.js development server:

```shell
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Smart Contract Testing

Run the Solidity tests for the MementoVol1 contract:

```shell
npx hardhat test solidity
```

### Smart Contract Deployment

Deploy the MementoVol1 contract to a local Hardhat network:

```shell
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy-memento.ts --network localhost
```

To deploy to Sepolia testnet, first set your private key:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then deploy:

```shell
npx hardhat run scripts/deploy-memento.ts --network sepolia
```

### Other Commands

- `npm run format` - Format code with Prettier
- `npm run hardhat:compile` - Compile smart contracts
- `npm run hardhat:test` - Run Solidity tests
- `npm run hardhat:node` - Start local Hardhat network

## Project Structure

```
├── contracts/          # Smart contracts
│   └── MementoVol1.sol # Main NFT contract
├── test/               # Contract tests
│   └── MementoVol1.t.sol # Solidity tests
├── scripts/            # Deployment scripts
├── app/                # Next.js frontend
├── components/         # React components
└── lib/                # Wagmi/Web3 configuration
```
