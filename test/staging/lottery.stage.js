const { expect } = require("chai");
const { ethers, getNamedAccounts } = require("hardhat");
const chainId = network.config.chainId;

chainId === 31337
  ? describe.skip
  : describe("fulfilrandomword", () => {
      let lotteryContract, entranceFee, deployer;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        lotteryContract = await ethers.getContract("Lottery", deployer);
        entranceFee = await lotteryContract.getEntranceFee();
      });
      it("should pay", async () => {
        console.log("waiting.....");
        await new Promise((resolve, reject) => {
          lotteryContract.once("lotteryWinner", async () => {
            try {
              const players = await lotteryContract.getPlayers();
              expect(players).to.equal(0);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
        await lotteryContract.pay({ value: entranceFee });
      });
    });
