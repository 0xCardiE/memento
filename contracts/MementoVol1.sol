// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MementoVol1 {
    struct Memento {
        string title;
        string content;
        address creator;
        uint256 timestamp;
        bool isActive;
    }

    mapping(uint256 => Memento) public mementos;
    mapping(address => uint256[]) public userMementos;
    uint256 public totalMementos;
    uint256 public nextMementoId;

    event MementoCreated(
        uint256 indexed mementoId,
        address indexed creator,
        string title,
        uint256 timestamp
    );

    event MementoUpdated(
        uint256 indexed mementoId,
        address indexed creator,
        string title,
        uint256 timestamp
    );

    event MementoDeactivated(
        uint256 indexed mementoId,
        address indexed creator,
        uint256 timestamp
    );

    modifier onlyMementoCreator(uint256 _mementoId) {
        require(mementos[_mementoId].creator == msg.sender, "Not the creator of this memento");
        _;
    }

    modifier mementoExists(uint256 _mementoId) {
        require(_mementoId < nextMementoId, "Memento does not exist");
        _;
    }

    modifier mementoActive(uint256 _mementoId) {
        require(mementos[_mementoId].isActive, "Memento is not active");
        _;
    }

    constructor() {
        nextMementoId = 0;
        totalMementos = 0;
    }

    function createMemento(string memory _title, string memory _content) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");

        uint256 mementoId = nextMementoId;
        
        mementos[mementoId] = Memento({
            title: _title,
            content: _content,
            creator: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        userMementos[msg.sender].push(mementoId);
        totalMementos++;
        nextMementoId++;

        emit MementoCreated(mementoId, msg.sender, _title, block.timestamp);
        
        return mementoId;
    }

    function updateMemento(
        uint256 _mementoId,
        string memory _title,
        string memory _content
    ) external mementoExists(_mementoId) onlyMementoCreator(_mementoId) mementoActive(_mementoId) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");

        mementos[_mementoId].title = _title;
        mementos[_mementoId].content = _content;
        mementos[_mementoId].timestamp = block.timestamp;

        emit MementoUpdated(_mementoId, msg.sender, _title, block.timestamp);
    }

    function deactivateMemento(uint256 _mementoId) 
        external 
        mementoExists(_mementoId) 
        onlyMementoCreator(_mementoId) 
        mementoActive(_mementoId) 
    {
        mementos[_mementoId].isActive = false;
        totalMementos--;

        emit MementoDeactivated(_mementoId, msg.sender, block.timestamp);
    }

    function getMemento(uint256 _mementoId) 
        external 
        view 
        mementoExists(_mementoId) 
        returns (
            string memory title,
            string memory content,
            address creator,
            uint256 timestamp,
            bool isActive
        ) 
    {
        Memento memory memento = mementos[_mementoId];
        return (
            memento.title,
            memento.content,
            memento.creator,
            memento.timestamp,
            memento.isActive
        );
    }

    function getUserMementos(address _user) external view returns (uint256[] memory) {
        return userMementos[_user];
    }

    function getUserMementoCount(address _user) external view returns (uint256) {
        return userMementos[_user].length;
    }

    function getActiveMementoCount() external view returns (uint256) {
        return totalMementos;
    }
} 