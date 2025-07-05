require("@nomicfoundation/hardhat-verify");

const config = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Flow EVM Testnet
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: process.env.HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY ? [process.env.HARDHAT_VAR_FLOW_TESTNET_PRIVATE_KEY] : [],
      chainId: 545,
    },
    
    // Flow EVM Mainnet
    flowMainnet: {
      url: "https://mainnet.evm.nodes.onflow.org",
      accounts: process.env.HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY ? [process.env.HARDHAT_VAR_FLOW_MAINNET_PRIVATE_KEY] : [],
      chainId: 747,
    },
  },
  etherscan: {
    apiKey: {
      flowTestnet: "empty", // Flow EVM doesn't require API key
      flowMainnet: "empty"
    },
    customChains: [
      {
        network: "flowTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io"
        }
      },
      {
        network: "flowMainnet", 
        chainId: 747,
        urls: {
          apiURL: "https://evm.flowscan.io/api",
          browserURL: "https://evm.flowscan.io"
        }
      }
    ]
  },
};

module.exports = config;
