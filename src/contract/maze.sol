// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MazeGameCore
 * @dev Core contract for managing maze game scores, achievements, and rewards
 */
contract MazeGameCore is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    
    struct PlayerStats {
        uint256 totalScore;
        uint256 gamesPlayed;
        uint256 levelsCompleted;
        uint256 perfectRuns;
        uint256 bestTime;
        uint256 currentStreak;
        uint256 lastPlayTime;
        bool isActive;
    }
    
    struct LevelScore {
        uint256 score;
        uint256 timeCompleted;
        uint256 starsCollected;
        bool isPerfect;
        uint256 timestamp;
    }
    
    struct GameSession {
        uint256 startTime;
        uint256 endTime;
        uint256 finalScore;
        uint8 levelsCompleted;
        bool isCompleted;
        bool rewardClaimed;
    }
    
    // Events
    event ScoreSubmitted(address indexed player, uint256 level, uint256 score, bool isPerfect);
    event GameSessionStarted(address indexed player, uint256 sessionId);
    event GameSessionCompleted(address indexed player, uint256 sessionId, uint256 finalScore);
    event RewardClaimed(address indexed player, uint256 amount);
    event AchievementUnlocked(address indexed player, string achievement);
    event LeaderboardUpdated(address indexed player, uint256 newRank);
    
    // State variables
    mapping(address => PlayerStats) public playerStats;
    mapping(address => mapping(uint256 => LevelScore)) public levelScores; // player => level => score
    mapping(address => GameSession[]) public gameSessions;
    mapping(address => uint256) public pendingRewards;
    mapping(address => mapping(string => bool)) public achievements;
    
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardPosition;
    
    uint256 public constant MAX_LEVELS = 10;
    uint256 public constant PERFECT_SCORE_BONUS = 1000;
    uint256 public constant TIME_BONUS_MULTIPLIER = 10;
    
    // Reward configuration
    uint256 public rewardPerLevel = 0.001 ether;
    uint256 public perfectRunBonus = 0.005 ether;
    uint256 public streakBonus = 0.002 ether;
    
    constructor() {}
    
    /**
     * @dev Submit a level score
     */
    function submitLevelScore(
        uint256 level,
        uint256 score,
        uint256 timeCompleted,
        uint256 starsCollected,
        bool isPerfect
    ) external whenNotPaused {
        require(level > 0 && level <= MAX_LEVELS, "Invalid level");
        require(score > 0, "Score must be positive");
        require(timeCompleted > 0, "Time must be positive");
        
        PlayerStats storage stats = playerStats[msg.sender];
        LevelScore storage levelScore = levelScores[msg.sender][level];
        
        // Only update if this is a better score
        if (score > levelScore.score) {
            levelScore.score = score;
            levelScore.timeCompleted = timeCompleted;
            levelScore.starsCollected = starsCollected;
            levelScore.isPerfect = isPerfect;
            levelScore.timestamp = block.timestamp;
            
            // Update player stats
            stats.totalScore += score;
            stats.lastPlayTime = block.timestamp;
            
            if (isPerfect) {
                stats.perfectRuns++;
                _checkAchievement(msg.sender, "PERFECT_RUN");
            }
            
            // Update best time if better
            if (stats.bestTime == 0 || timeCompleted < stats.bestTime) {
                stats.bestTime = timeCompleted;
                _checkAchievement(msg.sender, "SPEED_DEMON");
            }
            
            _updateLeaderboard(msg.sender);
            emit ScoreSubmitted(msg.sender, level, score, isPerfect);
        }
    }
    
    /**
     * @dev Start a new game session
     */
    function startGameSession() external whenNotPaused returns (uint256 sessionId) {
        GameSession memory newSession = GameSession({
            startTime: block.timestamp,
            endTime: 0,
            finalScore: 0,
            levelsCompleted: 0,
            isCompleted: false,
            rewardClaimed: false
        });
        
        gameSessions[msg.sender].push(newSession);
        sessionId = gameSessions[msg.sender].length - 1;
        
        PlayerStats storage stats = playerStats[msg.sender];
        stats.gamesPlayed++;
        stats.isActive = true;
        
        emit GameSessionStarted(msg.sender, sessionId);
        return sessionId;
    }
    
    /**
     * @dev Complete a game session
     */
    function completeGameSession(
        uint256 sessionId,
        uint256 finalScore,
        uint8 levelsCompleted
    ) external whenNotPaused {
        require(sessionId < gameSessions[msg.sender].length, "Invalid session ID");
        
        GameSession storage session = gameSessions[msg.sender][sessionId];
        require(!session.isCompleted, "Session already completed");
        require(session.startTime > 0, "Session not started");
        
        session.endTime = block.timestamp;
        session.finalScore = finalScore;
        session.levelsCompleted = levelsCompleted;
        session.isCompleted = true;
        
        PlayerStats storage stats = playerStats[msg.sender];
        stats.levelsCompleted += levelsCompleted;
        stats.isActive = false;
        
        // Calculate rewards
        uint256 baseReward = levelsCompleted * rewardPerLevel;
        uint256 totalReward = baseReward;
        
        // Add perfect run bonus
        if (_checkAllLevelsPerfect(msg.sender, levelsCompleted)) {
            totalReward += perfectRunBonus;
            _checkAchievement(msg.sender, "PERFECTIONIST");
        }
        
        // Add streak bonus
        if (_updateStreak(msg.sender)) {
            totalReward += streakBonus;
        }
        
        pendingRewards[msg.sender] += totalReward;
        
        _checkLevelAchievements(msg.sender, levelsCompleted);
        emit GameSessionCompleted(msg.sender, sessionId, finalScore);
    }
    
    /**
     * @dev Claim pending rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        require(address(this).balance >= reward, "Insufficient contract balance");
        
        pendingRewards[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
    
    /**
     * @dev Get level score for a player
     */
    function getLevelScore(address player, uint256 level) external view returns (LevelScore memory) {
        return levelScores[player][level];
    }
    
    /**
     * @dev Get top players from leaderboard
     */
    function getTopPlayers(uint256 count) external view returns (address[] memory) {
        uint256 length = count > leaderboard.length ? leaderboard.length : count;
        address[] memory topPlayers = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            topPlayers[i] = leaderboard[i];
        }
        
        return topPlayers;
    }
    
    /**
     * @dev Check if player has achievement
     */
    function hasAchievement(address player, string memory achievement) external view returns (bool) {
        return achievements[player][achievement];
    }
    
    /**
     * @dev Internal function to update leaderboard
     */
    function _updateLeaderboard(address player) internal {
        uint256 playerScore = playerStats[player].totalScore;
        uint256 currentPos = leaderboardPosition[player];
        
        // If player not on leaderboard, add them
        if (currentPos == 0 && (leaderboard.length == 0 || leaderboard[0] != player)) {
            leaderboard.push(player);
            currentPos = leaderboard.length;
        }
        
        // Bubble up if score improved
        while (currentPos > 1) {
            address abovePlayer = leaderboard[currentPos - 2];
            if (playerStats[abovePlayer].totalScore >= playerScore) {
                break;
            }
            
            // Swap positions
            leaderboard[currentPos - 1] = abovePlayer;
            leaderboard[currentPos - 2] = player;
            leaderboardPosition[abovePlayer] = currentPos;
            currentPos--;
        }
        
        leaderboardPosition[player] = currentPos;
        emit LeaderboardUpdated(player, currentPos);
    }
    
    /**
     * @dev Check and unlock achievements
     */
    function _checkAchievement(address player, string memory achievement) internal {
        if (!achievements[player][achievement]) {
            achievements[player][achievement] = true;
            emit AchievementUnlocked(player, achievement);
        }
    }
    
    /**
     * @dev Check level-based achievements
     */
    function _checkLevelAchievements(address player, uint8 levelsCompleted) internal {
        PlayerStats memory stats = playerStats[player];
        
        if (stats.levelsCompleted >= 10) {
            _checkAchievement(player, "MAZE_EXPLORER");
        }
        
        if (stats.levelsCompleted >= 50) {
            _checkAchievement(player, "MAZE_MASTER");
        }
        
        if (stats.gamesPlayed >= 100) {
            _checkAchievement(player, "DEDICATED_PLAYER");
        }
        
        if (stats.perfectRuns >= 10) {
            _checkAchievement(player, "PERFECTIONIST");
        }
    }
    
    /**
     * @dev Check if all levels in session were perfect
     */
    function _checkAllLevelsPerfect(address player, uint8 levelsCompleted) internal view returns (bool) {
        for (uint256 i = 1; i <= levelsCompleted; i++) {
            if (!levelScores[player][i].isPerfect) {
                return false;
            }
        }
        return levelsCompleted > 0;
    }
    
    /**
     * @dev Update and check streak
     */
    function _updateStreak(address player) internal returns (bool hasStreak) {
        PlayerStats storage stats = playerStats[player];
        
        // Check if last play was within 24 hours
        if (block.timestamp - stats.lastPlayTime <= 86400) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1;
        }
        
        if (stats.currentStreak >= 7) {
            _checkAchievement(player, "WEEK_WARRIOR");
            return true;
        }
        
        return false;
    }
    
    // Owner functions
    function setRewardRates(
        uint256 _rewardPerLevel,
        uint256 _perfectRunBonus,
        uint256 _streakBonus
    ) external onlyOwner {
        rewardPerLevel = _rewardPerLevel;
        perfectRunBonus = _perfectRunBonus;
        streakBonus = _streakBonus;
    }
    
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}

/**
 * @title MazeGameNFT
 * @dev NFT contract for maze game achievements and collectibles
 */
contract MazeGameNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct NFTMetadata {
        string name;
        string description;
        string imageURI;
        string achievementType;
        uint256 level;
        uint256 mintedAt;
        bool isSpecial;
    }
    
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => mapping(string => bool)) public playerAchievementNFTs;
    
    address public gameContract;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string achievementType);
    
    constructor() ERC721("MazeGame Achievement NFT", "MAZE") {}
    
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }
    
    function mintAchievementNFT(
        address to,
        string memory achievementType,
        string memory name,
        string memory description,
        string memory imageURI,
        uint256 level,
        bool isSpecial
    ) external returns (uint256) {
        require(msg.sender == gameContract || msg.sender == owner(), "Unauthorized minter");
        require(!playerAchievementNFTs[to][achievementType], "Achievement NFT already minted");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        
        nftMetadata[tokenId] = NFTMetadata({
            name: name,
            description: description,
            imageURI: imageURI,
            achievementType: achievementType,
            level: level,
            mintedAt: block.timestamp,
            isSpecial: isSpecial
        });
        
        playerAchievementNFTs[to][achievementType] = true;
        
        emit NFTMinted(to, tokenId, achievementType);
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}

/**
 * @title MazeGameTournament
 * @dev Contract for managing tournaments and competitions
 */
contract MazeGameTournament is Ownable, ReentrancyGuard {
    struct Tournament {
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxParticipants;
        uint256 participantCount;
        bool isActive;
        bool isCompleted;
        address winner;
        uint256[] levels;
    }
    
    struct TournamentScore {
        uint256 totalScore;
        uint256 completionTime;
        uint256 levelsCompleted;
        bool hasSubmitted;
    }
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => TournamentScore)) public tournamentScores;
    mapping(uint256 => address[]) public tournamentParticipants;
    
    uint256 public tournamentCounter;
    uint256 public platformFeePercent = 5; // 5%
    
    event TournamentCreated(uint256 indexed tournamentId, string name, uint256 prizePool);
    event TournamentJoined(uint256 indexed tournamentId, address indexed player);
    event TournamentScoreSubmitted(uint256 indexed tournamentId, address indexed player, uint256 score);
    event TournamentCompleted(uint256 indexed tournamentId, address indexed winner, uint256 prize);
    
    function createTournament(
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 entryFee,
        uint256 maxParticipants,
        uint256[] memory levels
    ) external onlyOwner returns (uint256 tournamentId) {
        require(startTime > block.timestamp, "Start time must be in future");
        require(endTime > startTime, "End time must be after start time");
        require(levels.length > 0, "Must specify at least one level");
        
        tournamentId = tournamentCounter++;
        
        tournaments[tournamentId] = Tournament({
            name: name,
            startTime: startTime,
            endTime: endTime,
            entryFee: entryFee,
            prizePool: 0,
            maxParticipants: maxParticipants,
            participantCount: 0,
            isActive: false,
            isCompleted: false,
            winner: address(0),
            levels: levels
        });
        
        emit TournamentCreated(tournamentId, name, 0);
        return tournamentId;
    }
    
    function joinTournament(uint256 tournamentId) external payable nonReentrant {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.startTime > 0, "Tournament does not exist");
        require(block.timestamp < tournament.startTime, "Tournament already started");
        require(tournament.participantCount < tournament.maxParticipants, "Tournament is full");
        require(msg.value == tournament.entryFee, "Incorrect entry fee");
        require(!tournamentScores[tournamentId][msg.sender].hasSubmitted, "Already joined");
        
        tournament.participantCount++;
        tournament.prizePool += msg.value;
        tournamentParticipants[tournamentId].push(msg.sender);
        
        emit TournamentJoined(tournamentId, msg.sender);
    }
    
    function submitTournamentScore(
        uint256 tournamentId,
        uint256 totalScore,
        uint256 completionTime,
        uint256 levelsCompleted
    ) external {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.startTime > 0, "Tournament does not exist");
        require(block.timestamp >= tournament.startTime, "Tournament not started");
        require(block.timestamp <= tournament.endTime, "Tournament ended");
        require(tournamentScores[tournamentId][msg.sender].hasSubmitted || _isParticipant(tournamentId, msg.sender), "Not a participant");
        
        tournamentScores[tournamentId][msg.sender] = TournamentScore({
            totalScore: totalScore,
            completionTime: completionTime,
            levelsCompleted: levelsCompleted,
            hasSubmitted: true
        });
        
        emit TournamentScoreSubmitted(tournamentId, msg.sender, totalScore);
    }
    
    function completeTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.startTime > 0, "Tournament does not exist");
        require(block.timestamp > tournament.endTime, "Tournament not ended");
        require(!tournament.isCompleted, "Tournament already completed");
        
        address winner = _findTournamentWinner(tournamentId);
        require(winner != address(0), "No valid winner found");
        
        tournament.winner = winner;
        tournament.isCompleted = true;
        
        uint256 platformFee = (tournament.prizePool * platformFeePercent) / 100;
        uint256 winnerPrize = tournament.prizePool - platformFee;
        
        (bool success, ) = winner.call{value: winnerPrize}("");
        require(success, "Prize transfer failed");
        
        emit TournamentCompleted(tournamentId, winner, winnerPrize);
    }
    
    function _findTournamentWinner(uint256 tournamentId) internal view returns (address winner) {
        address[] memory participants = tournamentParticipants[tournamentId];
        uint256 highestScore = 0;
        address currentWinner = address(0);
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            TournamentScore memory score = tournamentScores[tournamentId][participant];
            
            if (score.hasSubmitted && score.totalScore > highestScore) {
                highestScore = score.totalScore;
                currentWinner = participant;
            }
        }
        
        return currentWinner;
    }
    
    function _isParticipant(uint256 tournamentId, address player) internal view returns (bool) {
        address[] memory participants = tournamentParticipants[tournamentId];
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == player) {
                return true;
            }
        }
        return false;
    }
    
    function getTournamentParticipants(uint256 tournamentId) external view returns (address[] memory) {
        return tournamentParticipants[tournamentId];
    }
    
    function setPlatformFee(uint256 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 10, "Fee too high");
        platformFeePercent = _platformFeePercent;
    }
    
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
