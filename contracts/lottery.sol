// SPDX-License-Identifier: MIT
pragma solidity >0.5.0 <=0.9.0;

// For requesting vrf
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

// for fulfiling
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

// AutomationCompatible.sol imports the functions from both ./AutomationBase.sol and
// ./interfaces/AutomationCompatibleInterface.sol
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Lottery_notEnoughToken();
error Lottery_NotOpen();
error Lottery_upkeepNotNeeded(uint256 balance, uint256 state, uint256 players);
error Lottery_transactionFailed();

contract Lottery is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum Lottery_State {
        OPEN,
        CALCULATING
    }
    uint256 public immutable i_entranceFee;
    address payable[] private s_playerList;
    Lottery_State private s_lotteryState;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorInterface;
    uint256 private requestId;
    uint256 private immutable i_interval;
    uint256 private s_lastTimeStamp;
    address private Lottery_winner;

    //requestRandomVariables
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private immutable i_numWords = 1;
    // events
    event registeredPlayers(address indexed registeredPlayers);
    event requestIdReceived(uint256 indexed requestId);
    event lotteryWinner(address indexed lotteryWinnerAddress);

    constructor(
        uint256 entranceFee,
        address vrfCoodAddress,
        bytes32 keyHash,
        uint64 subId,
        uint32 callBackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoodAddress) {
        i_entranceFee = entranceFee;
        s_lotteryState = Lottery_State.OPEN;
        i_vrfCoordinatorInterface = VRFCoordinatorV2Interface(vrfCoodAddress);
        i_keyHash = keyHash;
        i_subId = subId;
        i_callbackGasLimit = callBackGasLimit;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
    }

    //have state to keep the lottery open or calculating
    // pay with a specific amount
    // keep player in a array
    // should withdraw to a random winner in the array

    function pay() public payable {
        if (s_lotteryState != Lottery_State.OPEN) {
            revert Lottery_NotOpen();
        }
        if (msg.value < i_entranceFee) {
            revert Lottery_notEnoughToken();
        }
        s_playerList.push(payable(msg.sender));

        emit registeredPlayers(msg.sender);
    }

    // UPKEEPS TO MAKE OUR CONTRACT AUTOMATIC REQUEST RANDOM NUMBERS
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upKeepNeeded, bytes memory /* perform Data */)
    {
        bool hasBalance = address(this).balance > 0;
        bool hasPlayers = s_playerList.length > 0;
        bool isOpened = (s_lotteryState == Lottery_State.OPEN);
        bool timeHasPassed = (block.timestamp - s_lastTimeStamp) > i_interval;

        upKeepNeeded = hasBalance && hasPlayers && isOpened && timeHasPassed;
    }

    function performUpkeep(bytes memory /* performData */) public {
        (bool upKeepNeeded, ) = checkUpkeep("0x");

        if (!upKeepNeeded) {
            revert Lottery_upkeepNotNeeded(
                address(this).balance,
                uint256(s_lotteryState),
                s_playerList.length
            );
        }

        requestId = i_vrfCoordinatorInterface.requestRandomWords(
            i_keyHash,
            i_subId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            i_numWords
        );
        s_lotteryState = Lottery_State.CALCULATING;
        emit requestIdReceived(requestId);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_playerList.length;

        address payable winner = s_playerList[indexOfWinner];

        Lottery_winner = winner;
        (bool success, ) = winner.call{value: address(this).balance}("");

        if (!success) {
            revert Lottery_transactionFailed();
        }
        s_playerList = new address payable[](0);

        s_lastTimeStamp = block.timestamp;

        s_lotteryState = Lottery_State.OPEN;

        emit lotteryWinner(winner);
    }

    function getWinner() public view returns (address) {
        return Lottery_winner;
    }

    function getPlayers() public view returns (uint256) {
        return s_playerList.length;
    }

    function getAPlayer(uint256 index) public view returns (address) {
        return s_playerList[index];
    }

    function getLastestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function lotteryState() public view returns (Lottery_State) {
        return s_lotteryState;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
