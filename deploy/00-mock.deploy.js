const { ethers, network } = require("hardhat");
const chainId = network.config.chainId;
module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("Mock Deploying...");
  const BASE_FEE = ethers.utils.parseEther("0.10");
  const GAS_PRICE_LINK = 1e9;

  if (chainId == 31337) {
    log("Mock Contract Detected");
    await deploy("VRFCoordinatorV2Mock", {
      contract: "VRFCoordinatorV2Mock",
      from: deployer,
      args: [BASE_FEE, GAS_PRICE_LINK],
      log: true,
    });
  }

  log("mock deploy done");
  log("___________________________________________________________________");
};

module.exports.tags = ["all", "mock"];
