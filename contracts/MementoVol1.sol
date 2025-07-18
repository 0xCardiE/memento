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
    uint256 public constant REGULAR_PRICE = 6.66 ether; // 6.66 FLOW
    uint256 public constant EARLY_BIRD_PRICE = 3.33 ether; // 3.33 FLOW
    uint256 public constant EARLY_BIRD_LIMIT = 200; // First 200 mints at half price
    uint256 public constant MAX_SUPPLY = 1000; // Maximum 1000 NFTs
    uint256 public immutable deploymentTimestamp; // Contract deployment time
    uint256 public constant MINTING_DURATION = 7 days; // 7-day minting window
    
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
        require(_tokenId >= 1 && _tokenId < nextTokenId, "Token does not exist");
        _;
    }

    constructor() ERC721("Shared Sediments", "SEDIMENTS") Ownable(msg.sender) {
        nextTokenId = 1; // Start NFT numbering from 1
        totalMementos = 0;
        deploymentTimestamp = block.timestamp; // Record deployment time for minting deadline
    }

    /**
     * @dev Step 1: User pays and submits prompt - emits event for backend processing
     */
    function getCurrentPrice() public view returns (uint256) {
        if (totalMementos < EARLY_BIRD_LIMIT) {
            return EARLY_BIRD_PRICE;
        } else {
            return REGULAR_PRICE;
        }
    }

    function requestMemento(
        string memory _title,
        string memory _content,
        string memory _aiPrompt
    ) external payable returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        require(msg.value >= currentPrice, "Insufficient payment");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_aiPrompt).length > 0, "AI prompt cannot be empty");
        require(totalMementos < MAX_SUPPLY, "Maximum supply of 1000 NFTs reached");
        require(block.timestamp <= deploymentTimestamp + MINTING_DURATION, "Minting period has ended (7 days)");

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
        
        // Count pending mementos (start from token ID 1)
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (mementos[i].isActive && !mementos[i].isGenerated) {
                count++;
            }
        }
        
        // Collect pending token IDs
        uint256[] memory pendingTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTokenId; i++) {
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

    /**
     * @dev Check if minting is still active
     */
    function isMintingActive() external view returns (bool) {
        return block.timestamp <= deploymentTimestamp + MINTING_DURATION && totalMementos < MAX_SUPPLY;
    }

    /**
     * @dev Get remaining time for minting (in seconds)
     */
    function getRemainingMintTime() external view returns (uint256) {
        uint256 endTime = deploymentTimestamp + MINTING_DURATION;
        if (block.timestamp >= endTime) {
            return 0;
        }
        return endTime - block.timestamp;
    }

    /**
     * @dev Get remaining supply
     */
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMementos;
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
        
        // Name: "Shared Sediments #[Token ID]"
        string memory name = string(abi.encodePacked("Shared Sediments #", _uint256ToString(_tokenId)));
        
        // Description: User's input only (title contains user's colors + thoughts)
        string memory description = memento.isGenerated 
            ? memento.title 
            : string(abi.encodePacked(memento.title, " [AI generation pending]"));
        
        return string(abi.encodePacked(
            '{"name":"', name, 
            '","description":"', description,
            '","image":"', memento.imageUri,
            '","attributes":[',
                '{"trait_type":"Collection","value":"Shared Sediments"},',
                '{"trait_type":"Artist","value":"Space Pony"},',
                '{"trait_type":"Creator","value":"', _addressToString(memento.creator), '"},',
                '{"trait_type":"Timestamp","value":"', _uint256ToString(memento.timestamp), '"}',
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