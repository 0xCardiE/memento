// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MementoVol1 } from "./MementoVol1.sol";
import { Test } from "forge-std/Test.sol";

contract MementoVol1Test is Test {
    MementoVol1 mementoContract;
    address alice = address(0x1);
    address bob = address(0x2);
    uint256 mintPrice = 0.001 ether;

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
            "https://example.com/image.jpg"
        );
        
        assertEq(tokenId, 0);
        assertEq(mementoContract.totalMementos(), 1);
        assertEq(mementoContract.nextTokenId(), 1);
        assertEq(mementoContract.ownerOf(tokenId), alice);
        
        (string memory title, string memory content, address creator, uint256 timestamp, bool isActive, string memory imageUrl) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(title, "My First Memory");
        assertEq(content, "This is my first memento content");
        assertEq(creator, alice);
        assertEq(imageUrl, "https://example.com/image.jpg");
        assertTrue(isActive);
        assertGt(timestamp, 0);
        
        vm.stopPrank();
    }

    function test_MintMementoInsufficientPayment() public {
        vm.startPrank(alice);
        vm.expectRevert("Insufficient payment for minting");
        mementoContract.mintMemento{value: mintPrice - 1}(
            "My Memory", 
            "Some content",
            "https://example.com/image.jpg"
        );
        vm.stopPrank();
    }

    function test_MintMementoEmptyTitle() public {
        vm.startPrank(alice);
        vm.expectRevert("Title cannot be empty");
        mementoContract.mintMemento{value: mintPrice}("", "Some content", "https://example.com/image.jpg");
        vm.stopPrank();
    }

    function test_MintMementoEmptyContent() public {
        vm.startPrank(alice);
        vm.expectRevert("Content cannot be empty");
        mementoContract.mintMemento{value: mintPrice}("Some title", "", "https://example.com/image.jpg");
        vm.stopPrank();
    }

    function test_UpdateMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Original Title", 
            "Original Content",
            "https://example.com/original.jpg"
        );
        
        mementoContract.updateMemento(tokenId, "Updated Title", "Updated Content", "https://example.com/updated.jpg");
        
        (string memory title, string memory content, address creator, uint256 timestamp, bool isActive, string memory imageUrl) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(title, "Updated Title");
        assertEq(content, "Updated Content");
        assertEq(creator, alice);
        assertEq(imageUrl, "https://example.com/updated.jpg");
        assertTrue(isActive);
        
        vm.stopPrank();
    }

    function test_UpdateMementoOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "https://example.com/alice.jpg"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the owner of this memento NFT");
        mementoContract.updateMemento(tokenId, "Bob's Update", "Bob's content", "https://example.com/bob.jpg");
        vm.stopPrank();
    }

    function test_DeactivateMemento() public {
        vm.startPrank(alice);
        
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "To be deactivated", 
            "Content",
            "https://example.com/deactivate.jpg"
        );
        assertEq(mementoContract.totalMementos(), 1);
        
        mementoContract.deactivateMemento(tokenId);
        
        (,,,, bool isActive,) = mementoContract.getMemento(tokenId);
        assertFalse(isActive);
        assertEq(mementoContract.totalMementos(), 0);
        
        vm.stopPrank();
    }

    function test_DeactivateMementoOnlyOwner() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Alice's Memory", 
            "Alice's content",
            "https://example.com/alice.jpg"
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
            "https://example.com/1.jpg"
        );
        uint256 memento2 = mementoContract.mintMemento{value: mintPrice}(
            "Memory 2", 
            "Content 2",
            "https://example.com/2.jpg"
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
            "https://example.com/alice.jpg"
        );
        vm.stopPrank();
        
        vm.startPrank(bob);
        mementoContract.mintMemento{value: mintPrice}(
            "Bob's Memory", 
            "Bob's content",
            "https://example.com/bob.jpg"
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

    function test_TokenURI() public {
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            "Test Memory", 
            "Test content",
            "https://example.com/test.jpg"
        );
        
        string memory tokenURI = mementoContract.tokenURI(tokenId);
        assertGt(bytes(tokenURI).length, 0);
        
        vm.stopPrank();
    }

    function test_WithdrawOnlyOwner() public {
        // First, mint some NFTs to add funds to the contract
        vm.startPrank(alice);
        mementoContract.mintMemento{value: mintPrice}(
            "Memory 1", 
            "Content 1",
            "https://example.com/1.jpg"
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

    function testFuzz_MintMemento(string memory title, string memory content) public {
        vm.assume(bytes(title).length > 0);
        vm.assume(bytes(content).length > 0);
        
        vm.startPrank(alice);
        uint256 tokenId = mementoContract.mintMemento{value: mintPrice}(
            title, 
            content,
            "https://example.com/fuzz.jpg"
        );
        
        (string memory storedTitle, string memory storedContent,,,, string memory imageUrl) = 
            mementoContract.getMemento(tokenId);
        
        assertEq(storedTitle, title);
        assertEq(storedContent, content);
        assertEq(imageUrl, "https://example.com/fuzz.jpg");
        assertEq(mementoContract.ownerOf(tokenId), alice);
        vm.stopPrank();
    }
} 