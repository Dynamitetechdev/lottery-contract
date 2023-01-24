const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { networkConfig } = require("../../helper.config");
const chainId = network.config.chainId;
describe("Lottery", () => {
  let deployer, lotteryContract, mockContract, interval;
  const entranceFee = ethers.utils.parseEther("0.1");
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    lotteryContract = await ethers.getContract("Lottery", deployer);
    mockContract = await ethers.getContract("VRFCoordinatorV2Mock");

    interval = await lotteryContract.getInterval();
    console.log(lotteryContract.address);
  });

  describe("pay", () => {
    it("should pay", async () => {
      await lotteryContract.pay({ value: entranceFee });
      const balance = await ethers.provider.getBalance(lotteryContract.address);
      assert(balance > 0);
      assert((await lotteryContract.getPlayers()) > 0);
    });

    it("emit an event", async () => {
      const tx = await lotteryContract.pay({ value: entranceFee });
      expect(tx).to.emit(lotteryContract, "registeredPlayers");
    });
  });

  describe("checkUpkeep", () => {
    it("should be calculating when we try to fund", async () => {
      await lotteryContract.pay({ value: entranceFee });

      await network.provider.send("evm_increaseTime", [
        interval.toNumber() + 1,
      ]);
      await network.provider.request({ method: "evm_mine", params: [] });

      const { upkeepNeeded } = await lotteryContract.callStatic.checkUpkeep(
        "0x"
      );
      await lotteryContract.performUpkeep("0x");

      await expect(
        lotteryContract.pay({ value: entranceFee })
      ).to.be.revertedWith("Lottery_NotOpen");

      expect(await lotteryContract.lotteryState()).to.equal(1);

      assert(!upkeepNeeded);
    });
  });

  describe("performUpkeep", () => {
    it("should emit an event when we call perform UpKeep", async () => {
      await lotteryContract.pay({ value: entranceFee });

      await network.provider.send("evm_increaseTime", [
        interval.toNumber() + 1,
      ]);
      await network.provider.request({ method: "evm_mine", params: [] });

      const performUpkeep = await lotteryContract.performUpkeep("0x");
      expect(performUpkeep).to.emit(lotteryContract, "requestIdReceived");
      expect(await lotteryContract.lotteryState()).to.equal(1);
    });
  });
});
