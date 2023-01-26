const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { networkConfig } = require("../../helper.config");
const chainId = network.config.chainId;

chainId !== 31337
  ? describe.skip
  : describe("Lottery", () => {
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
          const balance = await ethers.provider.getBalance(
            lotteryContract.address
          );
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

      describe("fulfilRandomWord", () => {
        beforeEach(async () => {
          await lotteryContract.pay({ value: entranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });

        it("should reset players,send money to winner and perform the fulfil random function", async () => {
          await new Promise(async (resolve, reject) => {
            console.log("waiting....");
            lotteryContract.once("lotteryWinner", async () => {
              try {
                const recentWinner = await lotteryContract.getWinner();
                console.log(`Recent Winner: ${recentWinner}`);
                const winnerEndingBalance = await accounts[0].getBalance();
                const endingTimeStamp =
                  await lotteryContract.getLastestTimeStamp();
                expect(await lotteryContract.getPlayers()).to.equal(0);
                expect(await lotteryContract.lotteryState()).to.equal(0);
                expect(endingTimeStamp > startTimeStamp);
                resolve();
                console.log("Withdraw Successful");
              } catch (error) {
                reject(error);
              }
            });

            const accounts = await ethers.getSigners();
            const winnerStartingBalance = await accounts[0].getBalance();
            const txResponse = await lotteryContract.performUpkeep("0x");
            const startTimeStamp = await lotteryContract.getLastestTimeStamp();

            const txReceipt = await txResponse.wait(1);
            const { requestId } = txReceipt.events[1].args;

            const players = await lotteryContract.getPlayers();
            console.log(players.toString());
            await mockContract.fulfillRandomWords(
              requestId,
              lotteryContract.address
            );
          });

          // expect(winnerEndingBalance).to.equal(
          //   winnerStartingBalance.add(entranceFee)
          // );
        });
      });
    });
