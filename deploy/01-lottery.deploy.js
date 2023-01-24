const { network, ethers } = require("hardhat");
const { networkConfig } = require("../helper.config");
const { verify } = require("../utils/verify");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = await deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  let mockContract, vrfAddress, subId;
  const subAmount = ethers.utils.parseEther("1");

  if (chainId === 31337) {
    mockContract = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfAddress = mockContract.address;

    const tx = await mockContract.createSubscription();
    const txReceipt = await tx.wait(1);

    log("getting SubId");
    subId = txReceipt.events[0].args.subId;

    await mockContract.fundSubscription(subId, subAmount);
  } else {
    vrfAddress = networkConfig[chainId]["vrfAddress"];
    subId = networkConfig[chainId]["subId"];
  }

  const arguments = [
    networkConfig[chainId]["entranceFee"],
    vrfAddress,
    networkConfig[chainId]["keyHash"],
    subId,
    networkConfig[chainId]["callBackGasLimit"],
    networkConfig[chainId]["interval"],
  ];

  const lotteryContract = await deploy("Lottery", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("Lottery Contract Deployed");
  log("--------------------------------------------");

  if (chainId === 31337) {
    await mockContract.addConsumer(subId.toNumber(), lotteryContract.address);
  }

  if (chainId !== 31337 && process.env.ETHER_SCAN_API_KEY) {
    await verify(lotteryContract.address, arguments);
    log("Contract Verified. Congratulations");
  }
};
module.exports.tags = ["all", "lottery"];
