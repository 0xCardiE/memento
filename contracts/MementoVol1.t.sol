// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MementoVol1 } from "./MementoVol1.sol";
import { Test } from "forge-std/Test.sol";

contract MementoVol1Test is Test {
    MementoVol1 mementoContract;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        mementoContract = new MementoVol1();
    }

    function test_InitialState() public view {
        assertEq(mementoContract.totalMementos(), 0);
        assertEq(mementoContract.nextMementoId(), 0);
        assertEq(mementoContract.getActiveMementoCount(), 0);
    }

    function test_CreateMemento() public {
        vm.startPrank(alice);
        
        uint256 mementoId = mementoContract.createMemento("My First Memory", "This is my first memento content");
        
        assertEq(mementoId, 0);
        assertEq(mementoContract.totalMementos(), 1);
        assertEq(mementoContract.nextMementoId(), 1);
        
        (string memory title, string memory content, address creator, uint256 timestamp, bool isActive) = 
            mementoContract.getMemento(mementoId);
        
        assertEq(title, "My First Memory");
        assertEq(content, "This is my first memento content");
        assertEq(creator, alice);
        assertTrue(isActive);
        assertGt(timestamp, 0);
        
        vm.stopPrank();
    }

    function test_CreateMementoEmptyTitle() public {
        vm.startPrank(alice);
        vm.expectRevert("Title cannot be empty");
        mementoContract.createMemento("", "Some content");
        vm.stopPrank();
    }

    function test_CreateMementoEmptyContent() public {
        vm.startPrank(alice);
        vm.expectRevert("Content cannot be empty");
        mementoContract.createMemento("Some title", "");
        vm.stopPrank();
    }

    function test_UpdateMemento() public {
        vm.startPrank(alice);
        
        uint256 mementoId = mementoContract.createMemento("Original Title", "Original Content");
        
        mementoContract.updateMemento(mementoId, "Updated Title", "Updated Content");
        
        (string memory title, string memory content, address creator, uint256 timestamp, bool isActive) = 
            mementoContract.getMemento(mementoId);
        
        assertEq(title, "Updated Title");
        assertEq(content, "Updated Content");
        assertEq(creator, alice);
        assertTrue(isActive);
        
        vm.stopPrank();
    }

    function test_UpdateMementoOnlyCreator() public {
        vm.startPrank(alice);
        uint256 mementoId = mementoContract.createMemento("Alice's Memory", "Alice's content");
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the creator of this memento");
        mementoContract.updateMemento(mementoId, "Bob's Update", "Bob's content");
        vm.stopPrank();
    }

    function test_DeactivateMemento() public {
        vm.startPrank(alice);
        
        uint256 mementoId = mementoContract.createMemento("To be deactivated", "Content");
        assertEq(mementoContract.totalMementos(), 1);
        
        mementoContract.deactivateMemento(mementoId);
        
        (,,,, bool isActive) = mementoContract.getMemento(mementoId);
        assertFalse(isActive);
        assertEq(mementoContract.totalMementos(), 0);
        
        vm.stopPrank();
    }

    function test_DeactivateMementoOnlyCreator() public {
        vm.startPrank(alice);
        uint256 mementoId = mementoContract.createMemento("Alice's Memory", "Alice's content");
        vm.stopPrank();
        
        vm.startPrank(bob);
        vm.expectRevert("Not the creator of this memento");
        mementoContract.deactivateMemento(mementoId);
        vm.stopPrank();
    }

    function test_GetUserMementos() public {
        vm.startPrank(alice);
        
        uint256 memento1 = mementoContract.createMemento("Memory 1", "Content 1");
        uint256 memento2 = mementoContract.createMemento("Memory 2", "Content 2");
        
        uint256[] memory userMementos = mementoContract.getUserMementos(alice);
        
        assertEq(userMementos.length, 2);
        assertEq(userMementos[0], memento1);
        assertEq(userMementos[1], memento2);
        assertEq(mementoContract.getUserMementoCount(alice), 2);
        
        vm.stopPrank();
    }

    function test_MultipleUsers() public {
        vm.startPrank(alice);
        mementoContract.createMemento("Alice's Memory", "Alice's content");
        vm.stopPrank();
        
        vm.startPrank(bob);
        mementoContract.createMemento("Bob's Memory", "Bob's content");
        vm.stopPrank();
        
        assertEq(mementoContract.getUserMementoCount(alice), 1);
        assertEq(mementoContract.getUserMementoCount(bob), 1);
        assertEq(mementoContract.totalMementos(), 2);
    }

    function test_NonExistentMemento() public {
        vm.expectRevert("Memento does not exist");
        mementoContract.getMemento(999);
    }

    function testFuzz_CreateMemento(string memory title, string memory content) public {
        vm.assume(bytes(title).length > 0);
        vm.assume(bytes(content).length > 0);
        
        vm.startPrank(alice);
        uint256 mementoId = mementoContract.createMemento(title, content);
        
        (string memory storedTitle, string memory storedContent,,,) = 
            mementoContract.getMemento(mementoId);
        
        assertEq(storedTitle, title);
        assertEq(storedContent, content);
        vm.stopPrank();
    }
} 