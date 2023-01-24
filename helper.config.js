const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
    entranceFee: ethers.utils.parseEther("0.1"),
    vrfAddress: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subId: "0",
    callBackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.utils.parseEther("0.1"),
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    callBackGasLimit: "500000",
    interval: "30",
  },
};
module.exports = {
  networkConfig,
};