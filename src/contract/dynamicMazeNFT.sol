// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title DynamicMazeNFT
 * @dev NFTs that evolve based on player performance and game achievements
 */
contract DynamicMazeNFT is ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    enum NFTType { CHARACTER_SKIN, LEVEL_DESIGN, ACHIEVEMENT_BADGE, AI_COMPANION }
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }

    struct NFTMetadata {
        NFTType nftType;
        Rarity rarity;
        uint256 level;
        uint256 experience;
        uint256 gamesPlayed;
        uint256 perfectRuns;
        uint256 aiInteractions;
        bool isEvolvable;
        uint256 lastUpdated;
        string customAttributes;
    }

    struct LevelDesign {
        uint256 difficulty;
        uint256 complexity;
        uint256 timesPlayed;
        uint256 averageRating;
        uint256 totalRatings;
        address designer;
        bool isAIGenerated;
        string mazeData; // JSON string of maze layout
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(uint256 => LevelDesign) public levelDesigns;
    mapping(address => mapping(NFTType => uint256[])) public playerNFTs;
    mapping(uint256 => uint256) public nftExperience;
    
    // Achievement tracking
    mapping(address => uint256) public playerTotalGames;
    mapping(address => uint256) public playerPerfectRuns;
    mapping(address => uint256) public playerAIInteractions;

    address public gameContract;
    uint256 public constant MAX_LEVEL = 100;
    uint256 public constant EVOLUTION_THRESHOLD = 1000;

    event NFTEvolved(uint256 indexed tokenId, uint256 newLevel, Rarity newRarity);
    event LevelDesignCreated(uint256 indexed tokenId, address indexed designer);
    event ExperienceGained(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("MazeGame Dynamic NFT", "MAZE-NFT") {}

    modifier onlyGameContract() {
        require(msg.sender == gameContract || msg.sender == owner(), "Unauthorized");
        _;
    }

    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    /**
     * @dev Mint a character skin NFT that evolves with gameplay
     */
    function mintCharacterSkin(
        address to,
        Rarity rarity,
        string memory customAttributes
    ) external onlyGameContract returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);

        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.CHARACTER_SKIN,
            rarity: rarity,
            level: 1,
            experience: 0,
            gamesPlayed: 0,
            perfectRuns: 0,
            aiInteractions: 0,
            isEvolvable: true,
            lastUpdated: block.timestamp,
            customAttributes: customAttributes
        });

        playerNFTs[to][NFTType.CHARACTER_SKIN].push(tokenId);
        return tokenId;
    }

    /**
     * @dev Mint level design NFT from user-created or AI-generated levels
     */
    function mintLevelDesign(
        address to,
        uint256 difficulty,
        uint256 complexity,
        bool isAIGenerated,
        string memory mazeData
    ) external onlyGameContract returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);

        Rarity rarity = _calculateLevelRarity(difficulty, complexity);
        
        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.LEVEL_DESIGN,
            rarity: rarity,
            level: difficulty,
            experience: 0,
            gamesPlayed: 0,
            perfectRuns: 0,
            aiInteractions: isAIGenerated ? 1 : 0,
            isEvolvable: true,
            lastUpdated: block.timestamp,
            customAttributes: ""
        });

        levelDesigns[tokenId] = LevelDesign({
            difficulty: difficulty,
            complexity: complexity,
            timesPlayed: 0,
            averageRating: 0,
            totalRatings: 0,
            designer: to,
            isAIGenerated: isAIGenerated,
            mazeData: mazeData
        });

        playerNFTs[to][NFTType.LEVEL_DESIGN].push(tokenId);
        emit LevelDesignCreated(tokenId, to);
        return tokenId;
    }

    /**
     * @dev Update NFT metadata based on gameplay performance
     */
    function updateNFTProgress(
        uint256 tokenId,
        uint256 gamesPlayed,
        uint256 perfectRuns,
        uint256 aiInteractions
    ) external onlyGameContract {
        require(_exists(tokenId), "Token does not exist");
        
        NFTMetadata storage metadata = nftMetadata[tokenId];
        
        // Update statistics
        metadata.gamesPlayed += gamesPlayed;
        metadata.perfectRuns += perfectRuns;
        metadata.aiInteractions += aiInteractions;
        metadata.lastUpdated = block.timestamp;

        // Calculate experience gain
        uint256 experienceGain = gamesPlayed * 10 + perfectRuns * 50 + aiInteractions * 5;
        metadata.experience += experienceGain;
        nftExperience[tokenId] += experienceGain;

        emit ExperienceGained(tokenId, experienceGain);

        // Check for level up and evolution
        _checkEvolution(tokenId);
    }

    /**
     * @dev Rate a level design NFT
     */
    function rateLevelDesign(uint256 tokenId, uint256 rating) external {
        require(_exists(tokenId), "Token does not exist");
        require(nftMetadata[tokenId].nftType == NFTType.LEVEL_DESIGN, "Not a level design NFT");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");

        LevelDesign storage level = levelDesigns[tokenId];
        
        // Update average rating
        uint256 newTotalRating = (level.averageRating * level.totalRatings) + rating;
        level.totalRatings += 1;
        level.averageRating = newTotalRating / level.totalRatings;

        // Award experience to the NFT based on ratings
        uint256 experienceBonus = rating * 20; // Higher ratings give more experience
        nftMetadata[tokenId].experience += experienceBonus;
        nftExperience[tokenId] += experienceBonus;

        emit ExperienceGained(tokenId, experienceBonus);
        _checkEvolution(tokenId);
    }

    /**
     * @dev Check if NFT should evolve based on experience and performance
     */
    function _checkEvolution(uint256 tokenId) internal {
        NFTMetadata storage metadata = nftMetadata[tokenId];
        
        if (!metadata.isEvolvable) return;

        uint256 requiredExp = metadata.level * EVOLUTION_THRESHOLD;
        
        if (metadata.experience >= requiredExp && metadata.level < MAX_LEVEL) {
            metadata.level += 1;
            
            // Potentially upgrade rarity at certain milestones
            if (metadata.level % 20 == 0 && metadata.rarity != Rarity.LEGENDARY) {
                metadata.rarity = Rarity(uint8(metadata.rarity) + 1);
            }
            
            emit NFTEvolved(tokenId, metadata.level, metadata.rarity);
        }
    }

    /**
     * @dev Calculate rarity for level designs based on difficulty and complexity
     */
    function _calculateLevelRarity(uint256 difficulty, uint256 complexity) 
        internal 
        pure 
        returns (Rarity) 
    {
        uint256 score = difficulty + complexity;
        
        if (score >= 18) return Rarity.LEGENDARY;
        if (score >= 14) return Rarity.EPIC;
        if (score >= 10) return Rarity.RARE;
        if (score >= 6) return Rarity.UNCOMMON;
        return Rarity.COMMON;
    }

    /**
     * @dev Generate dynamic metadata based on NFT current state
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "', _getNFTName(tokenId), '",',
            '"description": "', _getNFTDescription(tokenId), '",',
            '"image": "', _generateImageURI(tokenId), '",',
            '"attributes": [',
                '{"trait_type": "Type", "value": "', _getNFTTypeString(metadata.nftType), '"},',
                '{"trait_type": "Rarity", "value": "', _getRarityString(metadata.rarity), '"},',
                '{"trait_type": "Level", "value": ', metadata.level.toString(), '},',
                '{"trait_type": "Experience", "value": ', metadata.experience.toString(), '},',
                '{"trait_type": "Games Played", "value": ', metadata.gamesPlayed.toString(), '},',
                '{"trait_type": "Perfect Runs", "value": ', metadata.perfectRuns.toString(), '},',
                '{"trait_type": "AI Interactions", "value": ', metadata.aiInteractions.toString(), '},',
                '{"trait_type": "Evolvable", "value": "', metadata.isEvolvable ? 'true' : 'false', '"}',
            ']}'
        ))));
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getNFTName(uint256 tokenId) internal view returns (string memory) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        if (metadata.nftType == NFTType.CHARACTER_SKIN) {
            return string(abi.encodePacked("Maze Runner Skin #", tokenId.toString()));
        } else if (metadata.nftType == NFTType.LEVEL_DESIGN) {
            return string(abi.encodePacked("Custom Level #", tokenId.toString()));
        }
        
        return string(abi.encodePacked("Maze NFT #", tokenId.toString()));
    }

    function _getNFTDescription(uint256 tokenId) internal view returns (string memory) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        return string(abi.encodePacked(
            "A dynamic NFT that evolves with gameplay. ",
            "Level: ", metadata.level.toString(), " | ",
            "Experience: ", metadata.experience.toString(), " | ",
            "Rarity: ", _getRarityString(metadata.rarity)
        ));
    }

    function _generateImageURI(uint256 tokenId) internal view returns (string memory) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        // This would typically point to IPFS or generate SVG dynamically
        return string(abi.encodePacked(
            "https://api.mazegame.com/nft/image/",
            tokenId.toString(),
            "?level=", metadata.level.toString(),
            "&rarity=", uint8(metadata.rarity).toString()
        ));
    }

    function _getNFTTypeString(NFTType nftType) internal pure returns (string memory) {
        if (nftType == NFTType.CHARACTER_SKIN) return "Character Skin";
        if (nftType == NFTType.LEVEL_DESIGN) return "Level Design";
        if (nftType == NFTType.ACHIEVEMENT_BADGE) return "Achievement Badge";
        if (nftType == NFTType.AI_COMPANION) return "AI Companion";
        return "Unknown";
    }

    function _getRarityString(Rarity rarity) internal pure returns (string memory) {
        if (rarity == Rarity.COMMON) return "Common";
        if (rarity == Rarity.UNCOMMON) return "Uncommon";
        if (rarity == Rarity.RARE) return "Rare";
        if (rarity == Rarity.EPIC) return "Epic";
        if (rarity == Rarity.LEGENDARY) return "Legendary";
        return "Unknown";
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get all NFTs owned by an address of a specific type
     */
    function getNFTsByType(address owner, NFTType nftType) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return playerNFTs[owner][nftType];
    }

    /**
     * @dev Get level design data for a specific NFT
     */
    function getLevelDesignData(uint256 tokenId) 
        external 
        view 
        returns (LevelDesign memory) 
    {
        require(nftMetadata[tokenId].nftType == NFTType.LEVEL_DESIGN, "Not a level design NFT");
        return levelDesigns[tokenId];
    }
}
