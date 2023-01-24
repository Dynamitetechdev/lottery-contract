require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const GOERLI_RPC = process.env.GOERLI_RPC;
module.exports = {
  solidity: "0.8.17",

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    goerli: {
      url: GOERLI_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
    },
  },
  gasReporter: {
    enabled: false,
    noColors: true,
    outputFile: "gas-reporter.txt",
    currency: "USD",
    // coinmarketcap: "d4720ed6-4d46-4490-9a1c-c2b4539b3b5e",
    token: "ETH",
  },
  etherscan: {
    apiKey: {
      goerli: "VDPYH9I76NQNVCB1J68BGN5CV8BM7NPQSB",
    },
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};
