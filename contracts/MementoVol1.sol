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
        string imageUrl;
        bool isRevealed;
    }

    mapping(uint256 => Memento) public mementos;
    mapping(address => uint256[]) public userMementos;
    uint256 public totalMementos;
    uint256 public nextTokenId;
    uint256 public mintPrice = 0.003 ether; // ~$3 worth of ETH (approximate)
    
    string public placeholderImageUrl = "https://ipfs.io/ipfs/QmPlaceholderHashForUnrevealedNFT";

    event MementoMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string title,
        string aiPrompt,
        uint256 timestamp
    );

    event MementoRevealed(
        uint256 indexed tokenId,
        address indexed creator,
        string imageUrl,
        uint256 timestamp
    );

    event MementoUpdated(
        uint256 indexed tokenId,
        address indexed creator,
        string title,
        uint256 timestamp
    );

    event MementoDeactivated(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 timestamp
    );

    modifier onlyMementoOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of this memento NFT");
        _;
    }

    modifier mementoExists(uint256 _tokenId) {
        require(_tokenId < nextTokenId, "Memento NFT does not exist");
        _;
    }

    modifier mementoActive(uint256 _tokenId) {
        require(mementos[_tokenId].isActive, "Memento NFT is not active");
        _;
    }

    constructor() ERC721("Mement Machina Vol 1", "MEMO") Ownable(msg.sender) {
        nextTokenId = 0;
        totalMementos = 0;
    }

    /**
     * @dev Step 1: User pays and mints NFT with placeholder image
     * @param _title Title of the memento
     * @param _content Content/description of the memento
     * @param _aiPrompt AI prompt for image generation
     */
    function mintMemento(
        string memory _title, 
        string memory _content,
        string memory _aiPrompt
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment for minting");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_aiPrompt).length > 0, "AI prompt cannot be empty");

        uint256 tokenId = nextTokenId;
        
        // Mint the NFT to the sender
        _safeMint(msg.sender, tokenId);
        
        // Store the memento data with placeholder image
        mementos[tokenId] = Memento({
            title: _title,
            content: _content,
            aiPrompt: _aiPrompt,
            creator: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            imageUrl: placeholderImageUrl,
            isRevealed: false
        });

        userMementos[msg.sender].push(tokenId);
        totalMementos++;
        nextTokenId++;

        emit MementoMinted(tokenId, msg.sender, _title, _aiPrompt, block.timestamp);
        
        return tokenId;
    }

    /**
     * @dev Step 2: Owner reveals the AI-generated image (after processing)
     * @param _tokenId Token ID to reveal
     * @param _imageUrl Generated image URL from AI + IPFS
     */
    function revealMemento(uint256 _tokenId, string memory _imageUrl) 
        external 
        onlyOwner 
        mementoExists(_tokenId) 
        mementoActive(_tokenId) 
    {
        require(!mementos[_tokenId].isRevealed, "Memento already revealed");
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");

        mementos[_tokenId].imageUrl = _imageUrl;
        mementos[_tokenId].isRevealed = true;

        emit MementoRevealed(_tokenId, mementos[_tokenId].creator, _imageUrl, block.timestamp);
    }

    /**
     * @dev User can request reveal for their own NFT (triggers off-chain process)
     * @param _tokenId Token ID to request reveal for
     */
    function requestReveal(uint256 _tokenId) 
        external 
        mementoExists(_tokenId) 
        onlyMementoOwner(_tokenId) 
        mementoActive(_tokenId) 
    {
        require(!mementos[_tokenId].isRevealed, "Memento already revealed");
        
        // This function doesn't change state, just emits an event
        // The backend will listen for this event and process the AI generation
        emit MementoRevealed(_tokenId, msg.sender, "", block.timestamp);
    }

    /**
     * @dev Update memento details (only for revealed mementos)
     */
    function updateMemento(
        uint256 _tokenId,
        string memory _title,
        string memory _content
    ) external mementoExists(_tokenId) onlyMementoOwner(_tokenId) mementoActive(_tokenId) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");

        mementos[_tokenId].title = _title;
        mementos[_tokenId].content = _content;
        mementos[_tokenId].timestamp = block.timestamp;

        emit MementoUpdated(_tokenId, msg.sender, _title, block.timestamp);
    }

    function deactivateMemento(uint256 _tokenId) 
        external 
        mementoExists(_tokenId) 
        onlyMementoOwner(_tokenId) 
        mementoActive(_tokenId) 
    {
        mementos[_tokenId].isActive = false;
        totalMementos--;

        emit MementoDeactivated(_tokenId, msg.sender, block.timestamp);
    }

    function getMemento(uint256 _tokenId) 
        external 
        view 
        mementoExists(_tokenId) 
        returns (
            string memory title,
            string memory content,
            string memory aiPrompt,
            address creator,
            uint256 timestamp,
            bool isActive,
            string memory imageUrl,
            bool isRevealed
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
            memento.imageUrl,
            memento.isRevealed
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

    function getUnrevealedMementos() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First pass: count unrevealed mementos
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (mementos[i].isActive && !mementos[i].isRevealed) {
                count++;
            }
        }
        
        // Second pass: collect unrevealed token IDs
        uint256[] memory unrevealedTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (mementos[i].isActive && !mementos[i].isRevealed) {
                unrevealedTokens[index] = i;
                index++;
            }
        }
        
        return unrevealedTokens;
    }

    function isRevealed(uint256 _tokenId) external view mementoExists(_tokenId) returns (bool) {
        return mementos[_tokenId].isRevealed;
    }

    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }

    function setPlaceholderImageUrl(string memory _newPlaceholderUrl) external onlyOwner {
        placeholderImageUrl = _newPlaceholderUrl;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_tokenId < nextTokenId, "Token does not exist");
        
        Memento memory memento = mementos[_tokenId];
        
        // Different metadata based on reveal status
        string memory description = memento.isRevealed 
            ? memento.content 
            : string(abi.encodePacked(memento.content, " [UNREVEALED - AI IMAGE PENDING]"));
        
        return string(abi.encodePacked(
            '{"name":"', memento.title, 
            '","description":"', description,
            '","image":"', memento.imageUrl,
            '","attributes":[',
                '{"trait_type":"Creator","value":"', _addressToString(memento.creator), '"},',
                '{"trait_type":"Timestamp","value":"', _uint256ToString(memento.timestamp), '"},',
                '{"trait_type":"Active","value":"', memento.isActive ? "true" : "false", '"},',
                '{"trait_type":"Revealed","value":"', memento.isRevealed ? "true" : "false", '"},',
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