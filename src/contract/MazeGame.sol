// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MazeGame
 * @dev Standard contract for maze game with score tracking, leaderboards, and rewards
 * @notice This contract manages game sessions, scores, and player statistics
 */
contract MazeGame is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;

    // ==================== STRUCTS ====================

    struct Player {
        uint256 totalScore;
        uint256 gamesPlayed;
        uint256 levelsCompleted;
        uint256 perfectRuns;
        uint256 bestSingleScore;
        uint256 bestTime;
        uint256 totalTimePlayed;
        uint256 longestStreak;
        uint256 currentStreak;
        uint256 lastPlayedTime;
        uint256 totalRewardsEarned;
        bool isActive;
        uint256 registrationTime;
    }

    struct GameSession {
        address player;
        uint256 level;
        uint256 startTime;
        uint256 endTime;
        uint256 score;
        uint256 starsCollected;
        uint256 totalStars;
        bool completed;
        bool perfect;
        uint256 timeTaken;
        bool rewardClaimed;
    }

    struct LevelStats {
        uint256 totalAttempts;
        uint256 totalCompletions;
        uint256 averageScore;
        uint256 bestScore;
        uint256 bestTime;
        address recordHolder;
        uint256 totalStarsCollected;
        uint256 perfectRuns;
    }

    struct Leaderboard {
        address[] topPlayers;
        uint256[] topScores;
        uint256 lastUpdated;
    }

    // ==================== STATE VARIABLES ====================

    Counters.Counter private _gameSessionIds;
    
    // Player data
    mapping(address => Player) public players;
    mapping(address => uint256[]) public playerSessions;
    
    // Game sessions
    mapping(uint256 => GameSession) public gameSessions;
    
    // Level statistics
    mapping(uint256 => LevelStats) public levelStats;
    
    // Leaderboards
    Leaderboard public globalLeaderboard;
    mapping(uint256 => Leaderboard) public levelLeaderboards;
    
    // Game configuration
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    uint256 public constant MAX_LEVELS = 50;
    uint256 public constant PERFECT_RUN_BONUS = 1000;
    uint256 public constant STREAK_BONUS_MULTIPLIER = 50;
    
    // Rewards configuration
    uint256 public rewardPool;
    uint256 public rewardPerLevel = 0.001 ether;
    uint256 public perfectRunReward = 0.005 ether;
    uint256 public recordBreakerReward = 0.01 ether;
    
    // Game state
    uint256 public totalGamesPlayed;
    uint256 public totalPlayersRegistered;
    uint256 public totalRewardsDistributed;
    
    // Access control
    mapping(address => bool) public authorizedGameServers;

    // ==================== EVENTS ====================

    event PlayerRegistered(address indexed player, uint256 timestamp);
    event GameSessionStarted(address indexed player, uint256 indexed sessionId, uint256 level);
    event GameSessionCompleted(
        address indexed player, 
        uint256 indexed sessionId, 
        uint256 score, 
        bool perfect,
        uint256 timeTaken
    );
    event NewRecord(address indexed player, uint256 level, uint256 score, string recordType);
    event RewardClaimed(address indexed player, uint256 amount, string reason);
    event LeaderboardUpdated(uint256 level, address indexed player, uint256 newRank);
    event StreakAchieved(address indexed player, uint256 streakLength);

    // ==================== MODIFIERS ====================

    modifier onlyAuthorizedServer() {
        require(authorizedGameServers[msg.sender] || msg.sender == owner(), "Unauthorized server");
        _;
    }

    modifier validLevel(uint256 level) {
        require(level > 0 && level <= MAX_LEVELS, "Invalid level");
        _;
    }

    modifier playerExists(address player) {
        require(players[player].registrationTime > 0, "Player not registered");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor() {
        // Initialize global leaderboard
        globalLeaderboard.lastUpdated = block.timestamp;
        
        // Authorize owner as game server initially
        authorizedGameServers[msg.sender] = true;
    }

    // ==================== PLAYER MANAGEMENT ====================

    /**
     * @dev Register a new player
     * @param player Address of the player to register
     */
    function registerPlayer(address player) external onlyAuthorizedServer whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(players[player].registrationTime == 0, "Player already registered");

        players[player] = Player({
            totalScore: 0,
            gamesPlayed: 0,
            levelsCompleted: 0,
            perfectRuns: 0,
            bestSingleScore: 0,
            bestTime: type(uint256).max,
            totalTimePlayed: 0,
            longestStreak: 0,
            currentStreak: 0,
            lastPlayedTime: 0,
            totalRewardsEarned: 0,
            isActive: true,
            registrationTime: block.timestamp
        });

        totalPlayersRegistered++;
        emit PlayerRegistered(player, block.timestamp);
    }

    /**
     * @dev Get player statistics
     * @param player Address of the player
     * @return Player struct with all statistics
     */
    function getPlayer(address player) external view returns (Player memory) {
        return players[player];
    }

    /**
     * @dev Get player's game sessions
     * @param player Address of the player
     * @return Array of session IDs
     */
    function getPlayerSessions(address player) external view returns (uint256[] memory) {
        return playerSessions[player];
    }

    // ==================== GAME SESSION MANAGEMENT ====================

    /**
     * @dev Start a new game session
     * @param player Address of the player
     * @param level Level being played
     * @return sessionId Unique session identifier
     */
    function startGameSession(
        address player, 
        uint256 level
    ) external onlyAuthorizedServer validLevel(level) playerExists(player) whenNotPaused returns (uint256) {
        _gameSessionIds.increment();
        uint256 sessionId = _gameSessionIds.current();

        gameSessions[sessionId] = GameSession({
            player: player,
            level: level,
            startTime: block.timestamp,
            endTime: 0,
            score: 0,
            starsCollected: 0,
            totalStars: 0,
            completed: false,
            perfect: false,
            timeTaken: 0,
            rewardClaimed: false
        });

        playerSessions[player].push(sessionId);
        levelStats[level].totalAttempts++;
        
        emit GameSessionStarted(player, sessionId, level);
        return sessionId;
    }

    /**
     * @dev Complete a game session with results
     * @param sessionId Session identifier
     * @param score Final score achieved
     * @param starsCollected Number of stars collected
     * @param totalStars Total stars available in the level
     * @param completed Whether the level was completed
     */
    function completeGameSession(
        uint256 sessionId,
        uint256 score,
        uint256 starsCollected,
        uint256 totalStars,
        bool completed
    ) external onlyAuthorizedServer whenNotPaused {
        GameSession storage session = gameSessions[sessionId];
        require(session.player != address(0), "Invalid session");
        require(session.endTime == 0, "Session already completed");

        // Update session
        session.endTime = block.timestamp;
        session.score = score;
        session.starsCollected = starsCollected;
        session.totalStars = totalStars;
        session.completed = completed;
        session.timeTaken = session.endTime - session.startTime;
        session.perfect = completed && starsCollected == totalStars;

        // Update player stats
        Player storage player = players[session.player];
        player.gamesPlayed++;
        player.totalScore += score;
        player.totalTimePlayed += session.timeTaken;
        player.lastPlayedTime = block.timestamp;

        if (completed) {
            player.levelsCompleted++;
            levelStats[session.level].totalCompletions++;
            levelStats[session.level].totalStarsCollected += starsCollected;
            
            // Update streak
            if (player.lastPlayedTime > 0 && block.timestamp - player.lastPlayedTime < 86400) {
                player.currentStreak++;
            } else {
                player.currentStreak = 1;
            }
            
            if (player.currentStreak > player.longestStreak) {
                player.longestStreak = player.currentStreak;
                emit StreakAchieved(session.player, player.currentStreak);
            }
        } else {
            player.currentStreak = 0;
        }

        if (session.perfect) {
            player.perfectRuns++;
            levelStats[session.level].perfectRuns++;
        }

        // Update best scores and times
        if (score > player.bestSingleScore) {
            player.bestSingleScore = score;
        }

        if (completed && (player.bestTime == type(uint256).max || session.timeTaken < player.bestTime)) {
            player.bestTime = session.timeTaken;
        }

        // Update level statistics
        _updateLevelStats(session.level, score, session.timeTaken, completed);
        
        // Update leaderboards
        _updateLeaderboards(session.player, session.level, score);

        totalGamesPlayed++;
        
        emit GameSessionCompleted(
            session.player, 
            sessionId, 
            score, 
            session.perfect,
            session.timeTaken
        );
    }

    // ==================== LEADERBOARD MANAGEMENT ====================

    /**
     * @dev Update leaderboards with new score
     */
    function _updateLeaderboards(address player, uint256 level, uint256 score) internal {
        // Update global leaderboard
        _updateSingleLeaderboard(globalLeaderboard, player, players[player].totalScore);
        
        // Update level-specific leaderboard
        _updateSingleLeaderboard(levelLeaderboards[level], player, score);
    }

    function _updateSingleLeaderboard(
        Leaderboard storage leaderboard, 
        address player, 
        uint256 score
    ) internal {
        // Find existing position or insertion point
        uint256 insertIndex = leaderboard.topPlayers.length;
        bool playerExists = false;
        
        for (uint256 i = 0; i < leaderboard.topPlayers.length; i++) {
            if (leaderboard.topPlayers[i] == player) {
                playerExists = true;
                // Remove existing entry
                for (uint256 j = i; j < leaderboard.topPlayers.length - 1; j++) {
                    leaderboard.topPlayers[j] = leaderboard.topPlayers[j + 1];
                    leaderboard.topScores[j] = leaderboard.topScores[j + 1];
                }
                leaderboard.topPlayers.pop();
                leaderboard.topScores.pop();
                break;
            }
        }
        
        // Find correct insertion position
        insertIndex = leaderboard.topPlayers.length;
        for (uint256 i = 0; i < leaderboard.topPlayers.length; i++) {
            if (score > leaderboard.topScores[i]) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert at correct position
        if (insertIndex < MAX_LEADERBOARD_SIZE) {
            leaderboard.topPlayers.push(address(0));
            leaderboard.topScores.push(0);
            
            // Shift elements
            for (uint256 i = leaderboard.topPlayers.length - 1; i > insertIndex; i--) {
                leaderboard.topPlayers[i] = leaderboard.topPlayers[i - 1];
                leaderboard.topScores[i] = leaderboard.topScores[i - 1];
            }
            
            // Insert new entry
            leaderboard.topPlayers[insertIndex] = player;
            leaderboard.topScores[insertIndex] = score;
            
            // Trim if necessary
            if (leaderboard.topPlayers.length > MAX_LEADERBOARD_SIZE) {
                leaderboard.topPlayers.pop();
                leaderboard.topScores.pop();
            }
            
            leaderboard.lastUpdated = block.timestamp;
        }
    }

    /**
     * @dev Update level statistics
     */
    function _updateLevelStats(
        uint256 level, 
        uint256 score, 
        uint256 timeTaken, 
        bool completed
    ) internal {
        LevelStats storage stats = levelStats[level];
        
        if (completed) {
            // Update average score
            stats.averageScore = (stats.averageScore * (stats.totalCompletions - 1) + score) / stats.totalCompletions;
            
            // Check for new records
            if (score > stats.bestScore) {
                stats.bestScore = score;
                stats.recordHolder = gameSessions[_gameSessionIds.current()].player;
                emit NewRecord(stats.recordHolder, level, score, "Best Score");
            }
            
            if (timeTaken < stats.bestTime || stats.bestTime == 0) {
                stats.bestTime = timeTaken;
                emit NewRecord(gameSessions[_gameSessionIds.current()].player, level, timeTaken, "Best Time");
            }
        }
    }

    // ==================== REWARD SYSTEM ====================

    /**
     * @dev Claim rewards for completed sessions
     * @param sessionIds Array of session IDs to claim rewards for
     */
    function claimRewards(uint256[] calldata sessionIds) external nonReentrant whenNotPaused {
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < sessionIds.length; i++) {
            GameSession storage session = gameSessions[sessionIds[i]];
            require(session.player == msg.sender, "Not your session");
            require(session.completed, "Session not completed");
            require(!session.rewardClaimed, "Reward already claimed");
            
            session.rewardClaimed = true;
            
            uint256 sessionReward = rewardPerLevel;
            
            if (session.perfect) {
                sessionReward += perfectRunReward;
            }
            
            // Streak bonus
            uint256 streakBonus = players[msg.sender].currentStreak * STREAK_BONUS_MULTIPLIER;
            sessionReward += streakBonus;
            
            totalReward += sessionReward;
        }
        
        require(totalReward > 0, "No rewards to claim");
        require(address(this).balance >= totalReward, "Insufficient contract balance");
        
        players[msg.sender].totalRewardsEarned += totalReward;
        totalRewardsDistributed += totalReward;
        
        (bool success, ) = payable(msg.sender).call{value: totalReward}("");
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(msg.sender, totalReward, "Game completion rewards");
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get global leaderboard
     * @param limit Maximum number of entries to return
     * @return players Array of player addresses
     * @return scores Array of corresponding scores
     */
    function getGlobalLeaderboard(uint256 limit) external view returns (
        address[] memory players_,
        uint256[] memory scores
    ) {
        uint256 length = globalLeaderboard.topPlayers.length > limit ? limit : globalLeaderboard.topPlayers.length;
        
        players_ = new address[](length);
        scores = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            players_[i] = globalLeaderboard.topPlayers[i];
            scores[i] = globalLeaderboard.topScores[i];
        }
    }

    /**
     * @dev Get level-specific leaderboard
     * @param level Level number
     * @param limit Maximum number of entries to return
     */
    function getLevelLeaderboard(uint256 level, uint256 limit) external view validLevel(level) returns (
        address[] memory players_,
        uint256[] memory scores
    ) {
        Leaderboard storage leaderboard = levelLeaderboards[level];
        uint256 length = leaderboard.topPlayers.length > limit ? limit : leaderboard.topPlayers.length;
        
        players_ = new address[](length);
        scores = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            players_[i] = leaderboard.topPlayers[i];
            scores[i] = leaderboard.topScores[i];
        }
    }

    /**
     * @dev Get level statistics
     */
    function getLevelStats(uint256 level) external view validLevel(level) returns (LevelStats memory) {
        return levelStats[level];
    }

    /**
     * @dev Get game session details
     */
    function getGameSession(uint256 sessionId) external view returns (GameSession memory) {
        return gameSessions[sessionId];
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalPlayers,
        uint256 totalGames,
        uint256 totalRewards,
        uint256 contractBalance
    ) {
        return (
            totalPlayersRegistered,
            totalGamesPlayed,
            totalRewardsDistributed,
            address(this).balance
        );
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add authorized game server
     */
    function addAuthorizedServer(address server) external onlyOwner {
        authorizedGameServers[server] = true;
    }

    /**
     * @dev Remove authorized game server
     */
    function removeAuthorizedServer(address server) external onlyOwner {
        authorizedGameServers[server] = false;
    }

    /**
     * @dev Update reward amounts
     */
    function updateRewardAmounts(
        uint256 _rewardPerLevel,
        uint256 _perfectRunReward,
        uint256 _recordBreakerReward
    ) external onlyOwner {
        rewardPerLevel = _rewardPerLevel;
        perfectRunReward = _perfectRunReward;
        recordBreakerReward = _recordBreakerReward;
    }

    /**
     * @dev Add funds to reward pool
     */
    function addToRewardPool() external payable onlyOwner {
        rewardPool += msg.value;
    }

    /**
     * @dev Withdraw funds (emergency only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ==================== RECEIVE FUNCTION ====================

    receive() external payable {
        rewardPool += msg.value;
    }
}
