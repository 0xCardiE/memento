import type { HardhatUserConfig } from "hardhat/config";

import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  /*
   * In Hardhat 3, plugins are defined as part of the Hardhat config instead of
   * being based on the side-effect of imports.
   */
  plugins: [],
  solidity: {
    /*
     * Hardhat 3 supports different build profiles, allowing you to configure
     * different versions of `solc` and its settings for various use cases.
     *
     * Note: Using profiles is optional, and any Hardhat 2 `solidity` config
     * is still valid in Hardhat 3.
     */
    profiles: {
      /*
       * The default profile is used when no profile is defined or specified
       * in the CLI or by the tasks you are running.
       */
      default: {
        version: "0.8.28",
      },
      /*
       * The production profile is meant to be used for deployments, providing
       * more control over settings for production builds and taking some extra
       * steps to simplify the process of verifying your contracts.
       */
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
  /*
   * The `networks` configuration for Flow EVM networks.
   * Flow EVM supports both mainnet and testnet deployments.
   */
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
};

export default config;
