import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";

const config: any = {
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Flow EVM Testnet
    flowTestnet: {
      type: "http",
      chainType: "generic",
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: [configVariable("FLOW_TESTNET_PRIVATE_KEY")],
      chainId: 545,
    },
    
    // Flow EVM Mainnet
    flowMainnet: {
      type: "http",
      chainType: "generic",
      url: "https://mainnet.evm.nodes.onflow.org",
      accounts: [configVariable("FLOW_MAINNET_PRIVATE_KEY")],
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

export default config;
