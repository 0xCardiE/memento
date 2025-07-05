// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MementoVol1 is ERC721, Ownable {
    struct Memento {
        string title;
        string content;
        string aiPrompt;
        address creator;
        uint256 timestamp;
        bool isActive;
        string imageUri;
        bool isGenerated;
    }

    mapping(uint256 => Memento) public mementos;
    mapping(address => uint256[]) public userMementos;
    
    uint256 public totalMementos;
    uint256 public nextTokenId;
    uint256 public generationPrice = 6.66 ether; // 6.66 FLOW
    
    string public placeholderImageUri = "https://via.placeholder.com/512x512.png?text=AI+Generation+Pending";

    event MementoRequested(
        uint256 indexed tokenId,
        address indexed creator,
        string title,
        string content,
        string aiPrompt,
        uint256 timestamp
    );

    event MementoGenerated(
        uint256 indexed tokenId,
        address indexed creator,
        string imageUri,
        uint256 timestamp
    );

    modifier onlyTokenExists(uint256 _tokenId) {
        require(_tokenId < nextTokenId, "Token does not exist");
        _;
    }

    constructor() ERC721("Memento Machina", "MEMO") Ownable(msg.sender) {
        nextTokenId = 0;
        totalMementos = 0;
    }

    /**
     * @dev Step 1: User pays and submits prompt - emits event for backend processing
     */
    function requestMemento(
        string memory _title,
        string memory _content,
        string memory _aiPrompt
    ) external payable returns (uint256) {
        require(msg.value >= generationPrice, "Insufficient payment");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_aiPrompt).length > 0, "AI prompt cannot be empty");

        uint256 tokenId = nextTokenId;
        
        // Mint the NFT to the user with placeholder image
        _safeMint(msg.sender, tokenId);
        
        // Store the memento data with placeholder
        mementos[tokenId] = Memento({
            title: _title,
            content: _content,
            aiPrompt: _aiPrompt,
            creator: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            imageUri: placeholderImageUri,
            isGenerated: false
        });

        userMementos[msg.sender].push(tokenId);
        totalMementos++;
        nextTokenId++;

        // Emit event for backend processing
        emit MementoRequested(tokenId, msg.sender, _title, _content, _aiPrompt, block.timestamp);
        
        return tokenId;
    }

    /**
     * @dev Step 2: Backend updates URI after AI generation and SWARM storage (only once per NFT)
     */
    function updateMementoUri(uint256 _tokenId, string memory _imageUri) 
        external 
        onlyOwner 
        onlyTokenExists(_tokenId) 
    {
        require(!mementos[_tokenId].isGenerated, "NFT already generated - URI cannot be changed");
        require(bytes(_imageUri).length > 0, "Image URI cannot be empty");

        mementos[_tokenId].imageUri = _imageUri;
        mementos[_tokenId].isGenerated = true;

        emit MementoGenerated(_tokenId, mementos[_tokenId].creator, _imageUri, block.timestamp);
    }

    /**
     * @dev Get memento details
     */
    function getMemento(uint256 _tokenId) 
        external 
        view 
        onlyTokenExists(_tokenId) 
        returns (
            string memory title,
            string memory content,
            string memory aiPrompt,
            address creator,
            uint256 timestamp,
            bool isActive,
            string memory imageUri,
            bool isGenerated
        ) 
    {
        Memento memory memento = mementos[_tokenId];
        return (
            memento.title,
            memento.content,
            memento.aiPrompt,
            memento.creator,
            memento.timestamp,
            memento.isActive,
            memento.imageUri,
            memento.isGenerated
        );
    }

    /**
     * @dev Get all pending (ungenerated) mementos for backend processing
     */
    function getPendingMementos() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count pending mementos
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (mementos[i].isActive && !mementos[i].isGenerated) {
                count++;
            }
        }
        
        // Collect pending token IDs
        uint256[] memory pendingTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (mementos[i].isActive && !mementos[i].isGenerated) {
                pendingTokens[index] = i;
                index++;
            }
        }
        
        return pendingTokens;
    }

    function getUserMementos(address _user) external view returns (uint256[] memory) {
        return userMementos[_user];
    }

    function setGenerationPrice(uint256 _newPrice) external onlyOwner {
        generationPrice = _newPrice;
    }

    function setPlaceholderImageUri(string memory _newPlaceholderUri) external onlyOwner {
        placeholderImageUri = _newPlaceholderUri;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function tokenURI(uint256 _tokenId) public view override onlyTokenExists(_tokenId) returns (string memory) {
        Memento memory memento = mementos[_tokenId];
        
        string memory description = memento.isGenerated 
            ? memento.content 
            : string(abi.encodePacked(memento.content, " [AI IMAGE PENDING]"));
        
        return string(abi.encodePacked(
            '{"name":"', memento.title, 
            '","description":"', description,
            '","image":"', memento.imageUri,
            '","attributes":[',
                '{"trait_type":"Creator","value":"', _addressToString(memento.creator), '"},',
                '{"trait_type":"Timestamp","value":"', _uint256ToString(memento.timestamp), '"},',
                '{"trait_type":"Generated","value":"', memento.isGenerated ? "true" : "false", '"},',
                '{"trait_type":"AI Prompt","value":"', memento.aiPrompt, '"}',
            ']}'
        ));
    }

    // Helper functions for tokenURI
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
} 