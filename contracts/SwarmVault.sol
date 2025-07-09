// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for Swarm PostageStamp contract
interface IPostageStamp {
    function topUp(bytes32 batchId) external payable;
    function remainingBalance(bytes32 batchId) external view returns (uint256);
}

/**
 * @title SwarmVault
 * @dev A vault contract deployed on Gnosis Chain to manage postage stamp funding
 *      for permanent Swarm storage of Memento Machina NFT artwork.
 * 
 * Features:
 * - Receives funds from Flow EVM bridge or direct deposits
 * - Automatically tops up postage stamp when balance gets low
 * - Allows public contributions to extend storage duration
 * - Transparent tracking of all contributions and top-ups
 * - Emergency withdrawal for contract owner
 */
contract SwarmVault is Ownable, ReentrancyGuard {
    
    // Swarm PostageStamp contract on Gnosis Chain
    address public constant POSTAGE_STAMP_CONTRACT = 0x45a1502382541Cd610CC9068e88727426b696293;
    
    // Our specific postage stamp batch ID (from backend/index.js)
    bytes32 public constant BATCH_ID = 0xc0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278;
    
    // Minimum balance threshold to trigger automatic top-up
    uint256 public autoTopUpThreshold = 0.1 ether; // 0.1 xDAI
    
    // Amount to top up when threshold is reached
    uint256 public topUpAmount = 0.5 ether; // 0.5 xDAI
    
    // Total amount contributed by the community
    uint256 public totalCommunityContributions;
    
    // Total amount spent on postage stamp top-ups
    uint256 public totalTopUps;
    
    // Track individual contributor amounts
    mapping(address => uint256) public contributorAmounts;
    
    // Array to track all contributors for transparency
    address[] public contributors;
    
    // Events for transparency and tracking
    event ContributionReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event PostageStampTopUp(uint256 amount, uint256 newBalance, uint256 timestamp);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event TopUpAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    
    IPostageStamp public postageStamp;
    
    constructor() Ownable(msg.sender) {
        postageStamp = IPostageStamp(POSTAGE_STAMP_CONTRACT);
    }
    
    /**
     * @dev Receive function to accept direct xDAI deposits
     */
    receive() external payable {
        _handleContribution(msg.sender, msg.value);
    }
    
    /**
     * @dev Fallback function for any calls to the contract
     */
    fallback() external payable {
        _handleContribution(msg.sender, msg.value);
    }
    
    /**
     * @dev Public function to contribute to the vault
     */
    function contribute() external payable {
        require(msg.value > 0, "Contribution must be greater than 0");
        _handleContribution(msg.sender, msg.value);
    }
    
    /**
     * @dev Internal function to handle contributions
     */
    function _handleContribution(address contributor, uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");
        
        // Track contributor if first time
        if (contributorAmounts[contributor] == 0) {
            contributors.push(contributor);
        }
        
        // Update tracking
        contributorAmounts[contributor] += amount;
        totalCommunityContributions += amount;
        
        emit ContributionReceived(contributor, amount, block.timestamp);
        
        // Check if we should automatically top up
        _checkAndTopUp();
    }
    
    /**
     * @dev Check if balance is low and top up if needed
     */
    function _checkAndTopUp() internal {
        try postageStamp.remainingBalance(BATCH_ID) returns (uint256 remaining) {
            if (remaining < autoTopUpThreshold && address(this).balance >= topUpAmount) {
                _topUpPostageStamp(topUpAmount);
            }
        } catch {
            // If we can't check balance, try to top up anyway if we have enough funds
            if (address(this).balance >= topUpAmount) {
                _topUpPostageStamp(topUpAmount);
            }
        }
    }
    
    /**
     * @dev Top up the postage stamp with specified amount
     */
    function _topUpPostageStamp(uint256 amount) internal {
        require(address(this).balance >= amount, "Insufficient vault balance");
        
        // Call the topUp function on the PostageStamp contract
        postageStamp.topUp{value: amount}(BATCH_ID);
        
        // Update tracking
        totalTopUps += amount;
        
        emit PostageStampTopUp(amount, address(this).balance, block.timestamp);
    }
    
    /**
     * @dev Manual top up function (can be called by anyone)
     */
    function topUpPostageStamp() external nonReentrant {
        require(address(this).balance >= topUpAmount, "Insufficient vault balance");
        _topUpPostageStamp(topUpAmount);
    }
    
    /**
     * @dev Top up with custom amount (owner only)
     */
    function topUpPostageStampCustom(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient vault balance");
        _topUpPostageStamp(amount);
    }
    
    /**
     * @dev Update auto top-up threshold (owner only)
     */
    function updateAutoTopUpThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0, "Threshold must be greater than 0");
        uint256 oldThreshold = autoTopUpThreshold;
        autoTopUpThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev Update top-up amount (owner only)
     */
    function updateTopUpAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        uint256 oldAmount = topUpAmount;
        topUpAmount = newAmount;
        emit TopUpAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev Get postage stamp remaining balance
     */
    function getPostageStampBalance() external view returns (uint256) {
        try postageStamp.remainingBalance(BATCH_ID) returns (uint256 balance) {
            return balance;
        } catch {
            return 0;
        }
    }
    
    /**
     * @dev Get vault contract balance
     */
    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get total number of contributors
     */
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }
    
    /**
     * @dev Get contributor address by index
     */
    function getContributor(uint256 index) external view returns (address) {
        require(index < contributors.length, "Index out of bounds");
        return contributors[index];
    }
    
    /**
     * @dev Get comprehensive vault statistics
     */
    function getVaultStats() external view returns (
        uint256 vaultBalance,
        uint256 postageBalance,
        uint256 totalContributions,
        uint256 totalSpent,
        uint256 contributorCount,
        uint256 autoThreshold,
        uint256 topUpAmt
    ) {
        vaultBalance = address(this).balance;
        
        try postageStamp.remainingBalance(BATCH_ID) returns (uint256 balance) {
            postageBalance = balance;
        } catch {
            postageBalance = 0;
        }
        
        totalContributions = totalCommunityContributions;
        totalSpent = totalTopUps;
        contributorCount = contributors.length;
        autoThreshold = autoTopUpThreshold;
        topUpAmt = topUpAmount;
    }
    
    /**
     * @dev Emergency withdrawal function (owner only)
     * @param amount Amount to withdraw (0 = all)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        require(withdrawAmount <= balance, "Insufficient balance");
        
        (bool success, ) = payable(owner()).call{value: withdrawAmount}("");
        require(success, "Withdrawal failed");
        
        emit EmergencyWithdrawal(owner(), withdrawAmount);
    }
} 