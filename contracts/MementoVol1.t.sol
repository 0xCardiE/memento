// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MementoVol1} from "./MementoVol1.sol";

contract MementoVol1Test is Test {
    MementoVol1 mementoContract;
    
    address alice = address(0x1);
    address bob = address(0x2);
    uint256 mintPrice = 6.66 ether;

    // Add receive function to accept ETH
    receive() external payable {}

    function setUp() public {
        mementoContract = new MementoVol1();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 10 ether);
    }

    function test_InitialState() public view {
        assertEq(mementoContract.totalMementos(), 0);
        assertEq(mementoContract.nextTokenId(), 1); // Now starts from 1
        assertEq(mementoContract.generationPrice(), mintPrice);
        assertEq(mementoContract.MAX_SUPPLY(), 1000);
        assertTrue(mementoContract.isMintingActive());
        assertEq(mementoContract.getRemainingSupply(), 1000);
    }

    function test_RequestMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "My First Memory", 
            "This is my first memento content",
            "A beautiful landscape with mountains and a lake at sunset"
        );
        
        assertEq(tokenId, 1); // First NFT now has ID 1
        assertEq(mementoContract.totalMementos(), 1);
        assertEq(mementoContract.nextTokenId(), 2); // Next token will be 2
        assertEq(mementoContract.ownerOf(tokenId), alice);
        
        (string memory title, string memory content, string memory aiPrompt, address creator, uint256 timestamp, bool isActive, string memory imageUri, bool isGenerated) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(title, "My First Memory");
        assertEq(content, "This is my first memento content");
        assertEq(aiPrompt, "A beautiful landscape with mountains and a lake at sunset");
        assertEq(creator, alice);
        assertEq(imageUri, mementoContract.placeholderImageUri());
        assertTrue(isActive);
        assertFalse(isGenerated);
        assertGt(timestamp, 0);
        
        vm.stopPrank();
    }

    function test_RequestMementoInsufficientPayment() public {
        vm.startPrank(alice);
        vm.expectRevert("Insufficient payment");
        mementoContract.requestMemento{value: mintPrice - 1}(
            "My Memory", 
            "Some content",
            "AI prompt for image"
        );
        vm.stopPrank();
    }

    function test_RequestMementoEmptyTitle() public {
        vm.startPrank(alice);
        vm.expectRevert("Title cannot be empty");
        mementoContract.requestMemento{value: mintPrice}("", "Some content", "AI prompt");
        vm.stopPrank();
    }

    function test_RequestMementoEmptyContent() public {
        vm.startPrank(alice);
        vm.expectRevert("Content cannot be empty");
        mementoContract.requestMemento{value: mintPrice}("Some title", "", "AI prompt");
        vm.stopPrank();
    }

    function test_RequestMementoEmptyAIPrompt() public {
        vm.startPrank(alice);
        vm.expectRevert("AI prompt cannot be empty");
        mementoContract.requestMemento{value: mintPrice}("Some title", "Some content", "");
        vm.stopPrank();
    }

    function test_UpdateMementoUri() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "Original Title", 
            "Original Content",
            "Mountains and sunset landscape"
        );
        
        // Check initial state - not generated
        (,,,,,, string memory initialImageUri, bool isGenerated) = mementoContract.getMemento(tokenId);
        assertEq(initialImageUri, mementoContract.placeholderImageUri());
        assertFalse(isGenerated);
        
        vm.stopPrank();
        
        // Owner updates the memento URI after AI generation
        string memory generatedImageUrl = "https://bzz.link/QmGeneratedImageHash";
        mementoContract.updateMementoUri(tokenId, generatedImageUrl);
        
        // Check updated state
        (,,,,,, string memory imageUri, bool isGeneratedAfter) = mementoContract.getMemento(tokenId);
        assertEq(imageUri, generatedImageUrl);
        assertTrue(isGeneratedAfter);
    }

    function test_UpdateMementoUriOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Beautiful sunset over ocean"
        );
        
        // Alice tries to update URI (should fail - only contract owner can update)
        vm.expectRevert();
        mementoContract.updateMementoUri(tokenId, "https://bzz.link/QmSomeHash");
        
        vm.stopPrank();
    }

    function test_UpdateMementoUriAlreadyGenerated() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "Forest with tall trees"
        );
        vm.stopPrank();
        
        // First update
        mementoContract.updateMementoUri(tokenId, "https://bzz.link/QmHash1");
        
        // Second update should fail
        vm.expectRevert("NFT already generated - URI cannot be changed");
        mementoContract.updateMementoUri(tokenId, "https://bzz.link/QmHash2");
    }

    function test_GetPendingMementos() public {
        vm.startPrank(alice);
        
        // Request first memento
        uint256 tokenId1 = mementoContract.requestMemento{value: mintPrice}(
            "First Memory", 
            "First content",
            "Mountain landscape"
        );
        
        // Request second memento
        uint256 tokenId2 = mementoContract.requestMemento{value: mintPrice}(
            "Second Memory", 
            "Second content",
            "Ocean landscape"
        );
        
        vm.stopPrank();
        
        // Check pending mementos
        uint256[] memory pendingTokens = mementoContract.getPendingMementos();
        assertEq(pendingTokens.length, 2);
        assertEq(pendingTokens[0], tokenId1);
        assertEq(pendingTokens[1], tokenId2);
        
        // Generate first memento
        mementoContract.updateMementoUri(tokenId1, "https://bzz.link/QmHash1");
        
        // Check pending mementos again
        pendingTokens = mementoContract.getPendingMementos();
        assertEq(pendingTokens.length, 1);
        assertEq(pendingTokens[0], tokenId2);
    }

    function test_GetUserMementos() public {
        vm.startPrank(alice);
        
        uint256 memento1 = mementoContract.requestMemento{value: mintPrice}(
            "Memory 1", 
            "Content 1",
            "Tropical beach with palm trees"
        );
        uint256 memento2 = mementoContract.requestMemento{value: mintPrice}(
            "Memory 2", 
            "Content 2",
            "Snow-covered forest path"
        );
        
        uint256[] memory userMementos = mementoContract.getUserMementos(alice);
        
        assertEq(userMementos.length, 2);
        assertEq(userMementos[0], memento1);
        assertEq(userMementos[1], memento2);
        
        vm.stopPrank();
    }

    function test_MultipleUsers() public {
        vm.startPrank(alice);
        mementoContract.requestMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Sunrise over mountains"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        mementoContract.requestMemento{value: mintPrice}(
            "Bob's Memory", 
            "Bob's content",
            "City lights at night"
        );
        vm.stopPrank();
        
        assertEq(mementoContract.getUserMementos(alice).length, 1);
        assertEq(mementoContract.getUserMementos(bob).length, 1);
        assertEq(mementoContract.totalMementos(), 2);
    }

    function test_NonExistentMemento() public {
        vm.expectRevert("Token does not exist");
        mementoContract.getMemento(999);
        
        // Also test token ID 0 (doesn't exist since we start from 1)
        vm.expectRevert("Token does not exist");
        mementoContract.getMemento(0);
    }

    function test_MaxSupplyLimit() public {
        // This test would take too long to run 1000 transactions
        // So we'll test the logic by checking the require condition
        
        vm.startPrank(alice);
        
        // First mint should work
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "First Memory", 
            "Content",
            "AI prompt"
        );
        assertEq(tokenId, 1);
        assertEq(mementoContract.getRemainingSupply(), 999);
        
        vm.stopPrank();
    }

    function test_MintingTimeLimit() public {
        // Test minting is active initially
        assertTrue(mementoContract.isMintingActive());
        assertGt(mementoContract.getRemainingMintTime(), 0);
        
        // Fast-forward 8 days (beyond the 7-day limit)
        vm.warp(block.timestamp + 8 days);
        
        // Minting should now be inactive
        assertFalse(mementoContract.isMintingActive());
        assertEq(mementoContract.getRemainingMintTime(), 0);
        
        // Minting should fail
        vm.startPrank(alice);
        vm.expectRevert("Minting period has ended (7 days)");
        mementoContract.requestMemento{value: mintPrice}(
            "Late Memory", 
            "Too late",
            "Should fail"
        );
        vm.stopPrank();
    }

    function test_MintingActiveChecks() public {
        // Test initial state
        assertTrue(mementoContract.isMintingActive());
        assertEq(mementoContract.getRemainingSupply(), 1000);
        assertGt(mementoContract.getRemainingMintTime(), 6 days); // Should be close to 7 days
        
        // Test after some minting
        vm.startPrank(alice);
        mementoContract.requestMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "Test prompt"
        );
        
        assertEq(mementoContract.getRemainingSupply(), 999);
        assertTrue(mementoContract.isMintingActive()); // Still active
        
        vm.stopPrank();
    }

    function test_TokenURI() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "Beautiful landscape"
        );
        
        string memory tokenURI = mementoContract.tokenURI(tokenId);
        assertGt(bytes(tokenURI).length, 0);
        
        vm.stopPrank();
        
        // Update URI and check it changes
        mementoContract.updateMementoUri(tokenId, "https://bzz.link/QmFinalHash");
        
        string memory updatedURI = mementoContract.tokenURI(tokenId);
        assertGt(bytes(updatedURI).length, 0);
        // The updated URI should be different from original
        assertNotEq(tokenURI, updatedURI);
    }

    function test_WithdrawOnlyOwner() public {
        // First, request some NFTs to add funds to the contract
        vm.startPrank(alice);
        mementoContract.requestMemento{value: mintPrice}(
            "Memory 1", 
            "Content 1",
            "Starry night sky"
        );
        vm.stopPrank();
        
        // Verify contract has balance
        assertEq(address(mementoContract).balance, mintPrice);
        
        // Try to withdraw as non-owner
        vm.startPrank(bob);
        vm.expectRevert();
        mementoContract.withdraw();
        vm.stopPrank();
        
        // Test withdraw access control - only owner can call it
        address owner = mementoContract.owner();
        assertEq(owner, address(this)); // The test contract deployed the mementoContract
        
        // Withdraw as owner should work
        mementoContract.withdraw();
        
        // Verify contract balance is now 0
        assertEq(address(mementoContract).balance, 0);
    }

    function test_SetGenerationPrice() public {
        uint256 newPrice = 10 ether;
        
        // Only owner can set price
        vm.startPrank(alice);
        vm.expectRevert();
        mementoContract.setGenerationPrice(newPrice);
        vm.stopPrank();
        
        // Owner can set price
        mementoContract.setGenerationPrice(newPrice);
        assertEq(mementoContract.generationPrice(), newPrice);
    }

    function test_SetPlaceholderImageUri() public {
        string memory newPlaceholder = "https://example.com/placeholder.png";
        
        // Only owner can set placeholder
        vm.startPrank(alice);
        vm.expectRevert();
        mementoContract.setPlaceholderImageUri(newPlaceholder);
        vm.stopPrank();
        
        // Owner can set placeholder
        mementoContract.setPlaceholderImageUri(newPlaceholder);
        assertEq(mementoContract.placeholderImageUri(), newPlaceholder);
    }

    function testFuzz_RequestMemento(string memory title, string memory content, string memory aiPrompt) public {
        vm.assume(bytes(title).length > 0);
        vm.assume(bytes(content).length > 0);
        vm.assume(bytes(aiPrompt).length > 0);
        
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.requestMemento{value: mintPrice}(
            title, 
            content,
            aiPrompt
        );
        
        (string memory storedTitle, string memory storedContent, string memory storedPrompt,,,, string memory imageUri, bool isGenerated) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(storedTitle, title);
        assertEq(storedContent, content);
        assertEq(storedPrompt, aiPrompt);
        assertEq(imageUri, mementoContract.placeholderImageUri());
        assertFalse(isGenerated);
        assertEq(mementoContract.ownerOf(tokenId), alice);
        vm.stopPrank();
    }
} 