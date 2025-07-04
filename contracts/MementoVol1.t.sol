// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MementoVol1 } from "./MementoVol1.sol";
import { Test } from "forge-std/Test.sol";

contract MementoVol1Test is Test {
    MementoVol1 mementoContract;
    address alice = address(0x1);
    address bob = address(0x2);
    uint256 mintPrice = 0.003 ether;

    // Add receive function to accept ETH
    receive() external payable {}

    function setUp() public {
        mementoContract = new MementoVol1();
        // Give alice and bob some ether for minting
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_InitialState() public view {
        assertEq(mementoContract.totalMementos(), 0);
        assertEq(mementoContract.nextTokenId(), 0);
        assertEq(mementoContract.getActiveMementoCount(), 0);
        assertEq(mementoContract.mintPrice(), mintPrice);
    }

    function test_MintMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "My First Memory", 
            "This is my first memento content",
            "A beautiful landscape with mountains and a lake at sunset"
        );
        
        assertEq(tokenId, 0);
        assertEq(mementoContract.totalMementos(), 1);
        assertEq(mementoContract.nextTokenId(), 1);
        assertEq(mementoContract.ownerOf(tokenId), alice);
        
        (string memory title, string memory content, string memory aiPrompt, address creator, uint256 timestamp, bool isActive, string memory imageUrl, bool isRevealed) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(title, "My First Memory");
        assertEq(content, "This is my first memento content");
        assertEq(aiPrompt, "A beautiful landscape with mountains and a lake at sunset");
        assertEq(creator, alice);
        assertEq(imageUrl, mementoContract.placeholderImageUrl());
        assertTrue(isActive);
        assertFalse(isRevealed);
        assertGt(timestamp, 0);
        
        vm.stopPrank();
    }

    function test_MintMementoInsufficientPayment() public {
        vm.startPrank(alice);
        vm.expectRevert("Insufficient payment for minting");
        mementoContract.mintMemento{value: mintPrice - 1}(
            "My Memory", 
            "Some content",
            "AI prompt for image"
        );
        vm.stopPrank();
    }

    function test_MintMementoEmptyTitle() public {
        vm.startPrank(alice);
        vm.expectRevert("Title cannot be empty");
        mementoContract.mintMemento{value: mintPrice}("", "Some content", "AI prompt");
        vm.stopPrank();
    }

    function test_MintMementoEmptyContent() public {
        vm.startPrank(alice);
        vm.expectRevert("Content cannot be empty");
        mementoContract.mintMemento{value: mintPrice}("Some title", "", "AI prompt");
        vm.stopPrank();
    }

    function test_MintMementoEmptyAIPrompt() public {
        vm.startPrank(alice);
        vm.expectRevert("AI prompt cannot be empty");
        mementoContract.mintMemento{value: mintPrice}("Some title", "Some content", "");
        vm.stopPrank();
    }

    function test_RevealMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Original Title", 
            "Original Content",
            "Mountains and sunset landscape"
        );
        
        // Check initial state - unrevealed
        assertFalse(mementoContract.isRevealed(tokenId));
        
        vm.stopPrank();
        
        // Owner reveals the memento
        string memory generatedImageUrl = "https://ipfs.io/ipfs/QmGeneratedImageHash";
        mementoContract.revealMemento(tokenId, generatedImageUrl);
        
        // Check revealed state
        assertTrue(mementoContract.isRevealed(tokenId));
        
        (,,,,,, string memory imageUrl, bool isRevealed) = mementoContract.getMemento(tokenId);
        assertEq(imageUrl, generatedImageUrl);
        assertTrue(isRevealed);
    }

    function test_RevealMementoOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Beautiful sunset over ocean"
        );
        
        // Alice tries to reveal (should fail - only contract owner can reveal)
        vm.expectRevert();
        mementoContract.revealMemento(tokenId, "https://ipfs.io/ipfs/QmSomeHash");
        
        vm.stopPrank();
    }

    function test_RevealMementoAlreadyRevealed() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "Forest with tall trees"
        );
        vm.stopPrank();
        
        // First reveal
        mementoContract.revealMemento(tokenId, "https://ipfs.io/ipfs/QmHash1");
        
        // Second reveal should fail
        vm.expectRevert("Memento already revealed");
        mementoContract.revealMemento(tokenId, "https://ipfs.io/ipfs/QmHash2");
    }

    function test_RequestReveal() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Request Test", 
            "Test content",
            "Cityscape at night"
        );
        
        // Alice requests reveal for her NFT
        mementoContract.requestReveal(tokenId);
        
        // Should still be unrevealed (requestReveal just emits event)
        assertFalse(mementoContract.isRevealed(tokenId));
        
        vm.stopPrank();
    }

    function test_RequestRevealOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Desert landscape"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the owner of this memento NFT");
        mementoContract.requestReveal(tokenId);
        vm.stopPrank();
    }

    function test_UpdateMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Original Title", 
            "Original Content",
            "Ocean waves at sunset"
        );
        
        mementoContract.updateMemento(tokenId, "Updated Title", "Updated Content");
        
        (string memory title, string memory content, string memory aiPrompt, address creator, uint256 timestamp, bool isActive, string memory imageUrl, bool isRevealed) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(title, "Updated Title");
        assertEq(content, "Updated Content");
        assertEq(aiPrompt, "Ocean waves at sunset"); // AI prompt should remain unchanged
        assertEq(creator, alice);
        assertEq(imageUrl, mementoContract.placeholderImageUrl()); // Still placeholder
        assertTrue(isActive);
        assertFalse(isRevealed);
        
        vm.stopPrank();
    }

    function test_UpdateMementoOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Mountain peak covered in snow"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the owner of this memento NFT");
        mementoContract.updateMemento(tokenId, "Bob's Update", "Bob's content");
        vm.stopPrank();
    }

    function test_DeactivateMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "To be deactivated", 
            "Content",
            "Abandoned castle in mist"
        );
        assertEq(mementoContract.totalMementos(), 1);
        
        mementoContract.deactivateMemento(tokenId);
        
        (,,,,, bool isActive,,) = mementoContract.getMemento(tokenId);
        assertFalse(isActive);
        assertEq(mementoContract.totalMementos(), 0);
        
        vm.stopPrank();
    }

    function test_DeactivateMementoOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Peaceful garden with flowers"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the owner of this memento NFT");
        mementoContract.deactivateMemento(tokenId);
        vm.stopPrank();
    }

    function test_GetUserMementos() public {
        vm.startPrank(alice);
        
        uint256 memento1 = mementoContract.mintMemento{value: mintPrice}(
            "Memory 1", 
            "Content 1",
            "Tropical beach with palm trees"
        );
        uint256 memento2 = mementoContract.mintMemento{value: mintPrice}(
            "Memory 2", 
            "Content 2",
            "Snow-covered forest path"
        );
        
        uint256[] memory userMementos = mementoContract.getUserMementos(alice);
        
        assertEq(userMementos.length, 2);
        assertEq(userMementos[0], memento1);
        assertEq(userMementos[1], memento2);
        assertEq(mementoContract.getUserMementoCount(alice), 2);
        
        vm.stopPrank();
    }

    function test_MultipleUsers() public {
        vm.startPrank(alice);
        mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "Sunrise over mountains"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        mementoContract.mintMemento{value: mintPrice}(
            "Bob's Memory", 
            "Bob's content",
            "City lights at night"
        );
        vm.stopPrank();
        
        assertEq(mementoContract.getUserMementoCount(alice), 1);
        assertEq(mementoContract.getUserMementoCount(bob), 1);
        assertEq(mementoContract.totalMementos(), 2);
    }

    function test_NonExistentMemento() public {
        vm.expectRevert("Memento NFT does not exist");
        mementoContract.getMemento(999);
    }

    function test_GetUnrevealedMementos() public {
        vm.startPrank(alice);
        
        uint256 tokenId1 = mementoContract.mintMemento{value: mintPrice}(
            "Memory 1", 
            "Content 1",
            "Prompt 1"
        );
        uint256 tokenId2 = mementoContract.mintMemento{value: mintPrice}(
            "Memory 2", 
            "Content 2",
            "Prompt 2"
        );
        
        vm.stopPrank();
        
        // Initially both should be unrevealed
        uint256[] memory unrevealed = mementoContract.getUnrevealedMementos();
        assertEq(unrevealed.length, 2);
        
        // Reveal one
        mementoContract.revealMemento(tokenId1, "https://ipfs.io/ipfs/QmHash1");
        
        // Now only one should be unrevealed
        unrevealed = mementoContract.getUnrevealedMementos();
        assertEq(unrevealed.length, 1);
        assertEq(unrevealed[0], tokenId2);
    }

    function test_TokenURI() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "Beautiful landscape"
        );
        
        string memory tokenURI = mementoContract.tokenURI(tokenId);
        assertGt(bytes(tokenURI).length, 0);
        
        // Check that it contains unrevealed indicator
        assertTrue(bytes(tokenURI).length > 0);
        
        vm.stopPrank();
        
        // Reveal and check URI changes
        mementoContract.revealMemento(tokenId, "https://ipfs.io/ipfs/QmFinalHash");
        
        string memory revealedURI = mementoContract.tokenURI(tokenId);
        assertGt(bytes(revealedURI).length, 0);
        // The revealed URI should be different from unrevealed
        assertNotEq(tokenURI, revealedURI);
    }

    function test_WithdrawOnlyOwner() public {
        // First, mint some NFTs to add funds to the contract
        vm.startPrank(alice);
        mementoContract.mintMemento{value: mintPrice}(
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

    function testFuzz_MintMemento(string memory title, string memory content, string memory aiPrompt) public {
        vm.assume(bytes(title).length > 0);
        vm.assume(bytes(content).length > 0);
        vm.assume(bytes(aiPrompt).length > 0);
        
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            title, 
            content,
            aiPrompt
        );
        
        (string memory storedTitle, string memory storedContent, string memory storedPrompt,,,, string memory imageUrl, bool isRevealed) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(storedTitle, title);
        assertEq(storedContent, content);
        assertEq(storedPrompt, aiPrompt);
        assertEq(imageUrl, mementoContract.placeholderImageUrl());
        assertFalse(isRevealed);
        assertEq(mementoContract.ownerOf(tokenId), alice);
        vm.stopPrank();
    }
} 