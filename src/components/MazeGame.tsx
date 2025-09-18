// src/components/MazeGame.tsx - Main Game Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, GameSettings, CELL_TYPES } from '../types/game.types';
import { LEVELS, DEFAULT_SETTINGS } from '../utilities/gameConstant';
import { isValidPosition, checkEnemyCollision, isCollectible, isExit } from '../utilities/collision';
import { removeCollectible, countCells, cloneMaze } from '../utilities/mazeUtilities';
import { useGameState } from '../hook/useGameState';
import { useGameTimer } from '../hook/useGameTimer';
import { usePlayerMovement } from '../hook/usePlayerMovement';
import { useEnemyAI } from '../hook/useEnemyAI';
import { useSound } from '../hook/useSound';

import MainMenu from './MainMenu';
import MazeRenderer from './MazeRenderer';
import GameControls from './GameControls';
import {
  GameOverModal,
  LevelCompleteModal,
  GameCompleteModal,
  PauseModal
} from './GameModals';

interface MazeGameProps {
  initialSettings?: Partial<GameSettings>;
}

const MazeGame: React.FC<MazeGameProps> = ({ initialSettings }) => {
  // Game settings
  const [settings, setSettings] = useState<GameSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  });

  // Current maze state
  const [currentMaze, setCurrentMaze] = useState<number[][]>([]);
  const [enemies, setEnemies] = useState<Position[]>([]);

  // Game state management
  const gameStateHook = useGameState(LEVELS);
  const {
    gameState,
    currentLevel,
    score,
    totalScore,
    collectedItems,
    timeLeft,
    setGameState,
    nextLevel,
    resetLevel,
    addScore,
    collectItem,
    setTimeLeft,
    initializeLevel,
    canExitLevel
  } = gameStateHook;

  // Game timer
  const gameTimer = useGameTimer(
    () => setGameState('lost'),
    gameState
  );

  // Player movement
  const playerMovement = usePlayerMovement(
    currentMaze,
    handleCollectItem,
    handleReachExit,
    gameState
  );
  const { playerPos, movePlayer, setPlayerPosition, resetPosition } = playerMovement;

  // Enemy AI
  const enemyAI = useEnemyAI(
    currentMaze,
    playerPos,
    gameState,
    settings.difficulty
  );
  const { updateEnemies, isPlayerCaught, resetEnemies } = enemyAI;

  // Sound effects
  const { playSound } = useSound(settings.soundEnabled);

  // Game loop timing
  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Initialize level data
  const initializeCurrentLevel = useCallback(() => {
    const level = LEVELS[currentLevel];
    if (!level) return;

    // Set maze
    setCurrentMaze(cloneMaze(level.maze));
    
    // Set player position
    setPlayerPosition(level.playerStart);
    
    // Set enemies
    setEnemies(level.enemyPositions);
    resetEnemies(level.enemyPositions);
    
    // Start timer
    gameTimer.startTimer(level.timeLimit);
    setTimeLeft(level.timeLimit);
    
    playSound('start');
  }, [currentLevel, setPlayerPosition, resetEnemies, gameTimer, setTimeLeft, playSound]);

  // Handle item collection
  function handleCollectItem() {
    const newMaze = removeCollectible(currentMaze, playerPos.x, playerPos.y);
    setCurrentMaze(newMaze);
    collectItem();
    playSound('collect');
  }

  // Handle reaching exit
  function handleReachExit() {
    if (canExitLevel()) {
      setGameState('won');
      gameTimer.stopTimer();
      playSound('win');
    }
  }

  // Handle player movement
  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const moved = movePlayer(dx, dy);
    if (moved) {
      playSound('move', 0.2);
    }
  }, [gameState, movePlayer, playSound]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      gameTimer.pauseTimer();
      playSound('pause');
    } else if (gameState === 'paused') {
      setGameState('playing');
      gameTimer.resumeTimer();
    }
  }, [gameState, setGameState, gameTimer, playSound]);

  // Handle level reset
  const handleReset = useCallback(() => {
    resetLevel();
    initializeCurrentLevel();
    setGameState('playing');
    playSound('reset');
  }, [resetLevel, initializeCurrentLevel, setGameState, playSound]);

  // Handle return to menu
  const handleMenu = useCallback(() => {
    gameTimer.stopTimer();
    setGameState('menu');
  }, [gameTimer, setGameState]);

  // Handle start game
  const handleStartGame = useCallback(() => {
    initializeLevel(0);
    initializeCurrentLevel();
  }, [initializeLevel, initializeCurrentLevel]);

  // Handle level select
  const handleLevelSelect = useCallback((levelIndex: number) => {
    initializeLevel(levelIndex);
    initializeCurrentLevel();
  }, [initializeLevel, initializeCurrentLevel]);

  // Handle next level
  const handleNextLevel = useCallback(() => {
    nextLevel();
    if (currentLevel + 1 < LEVELS.length) {
      setTimeout(initializeCurrentLevel, 100);
    }
  }, [nextLevel, currentLevel, initializeCurrentLevel]);

  // Handle game complete
  const handlePlayAgain = useCallback(() => {
    initializeLevel(0);
    initializeCurrentLevel();
  }, [initializeLevel, initializeCurrentLevel]);

  // Game loop for enemy movement and collision detection
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        // Update enemies
        updateEnemies();
        
        // Check for player-enemy collision
        if (isPlayerCaught(playerPos)) {
          setGameState('lost');
          gameTimer.stopTimer();
          playSound('lose');
        }
      }, enemyAI.enemyMoveInterval);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, updateEnemies, isPlayerCaught, playerPos, setGameState, gameTimer, playSound, enemyAI.enemyMoveInterval]);

  // Update enemies state when enemyAI changes
  useEffect(() => {
    setEnemies(enemyAI.enemies);
  }, [enemyAI.enemies]);

  // Initialize first level when game starts
  useEffect(() => {
    if (gameState === 'playing' && currentMaze.length === 0) {
      initializeCurrentLevel();
    }
  }, [gameState, currentMaze.length, initializeCurrentLevel]);

  // Settings change handler
  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
  }, []);

  // Sound toggle handler
  const handleSoundToggle = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  // Render main menu
  if (gameState === 'menu') {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onLevelSelect={handleLevelSelect}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  // Get current level data for display
  const currentLevelData = LEVELS[currentLevel];
  const remainingCollectibles = currentLevelData ? 
    currentLevelData.collectibles - collectedItems : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Game Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Level {currentLevel + 1}: {currentLevelData?.name}
          </h1>
          
          {/* Game Stats */}
          <div className="flex justify-center space-x-8 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{score.toLocaleString()}</div>
              <div className="text-sm opacity-75">Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {gameTimer.formatTime(timeLeft)}
              </div>
              <div className="text-sm opacity-75">Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                ⭐ {remainingCollectibles}
              </div>
              <div className="text-sm opacity-75">Stars Left</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{enemies.length}</div>
              <div className="text-sm opacity-75">Enemies</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          
          {/* Maze Display */}
          <div className="flex-1 flex justify-center">
            <MazeRenderer
              maze={currentMaze}
              playerPos={playerPos}
              enemies={enemies}
              theme={settings.theme}
              animations={settings.animations}
              cellSize={24}
              showGrid={false}
            />
          </div>
          
          {/* Game Controls */}
          <div className="lg:w-80">
            <GameControls
              onMove={handleMove}
              onPause={handlePause}
              onReset={handleReset}
              onMenu={handleMenu}
              gameState={gameState}
              controlStyle={settings.controlStyle}
              soundEnabled={settings.soundEnabled}
              onSoundToggle={handleSoundToggle}
            />
          </div>
        </div>

        {/* Game Status */}
        {gameState === 'paused' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">⏸️</div>
              <div className="text-2xl font-bold mb-2">Game Paused</div>
              <div className="text-lg opacity-75">Press SPACE to continue</div>
            </div>
          </div>
        )}
      </div>

      {/* Game Modals */}
      <GameOverModal
        isOpen={gameState === 'lost'}
        onRetry={handleReset}
        onMenu={handleMenu}
        reason={timeLeft <= 0 ? 'timeout' : 'enemy'}
        score={score}
        timeElapsed={currentLevelData ? currentLevelData.timeLimit - timeLeft : 0}
        level={currentLevel + 1}
      />

      <LevelCompleteModal
        isOpen={gameState === 'won'}
        onNextLevel={handleNextLevel}
        onReplay={handleReset}
        onMenu={handleMenu}
        levelData={{
          number: currentLevel + 1,
          name: currentLevelData?.name || '',
          score: score,
          timeBonus: timeLeft * 10,
          totalScore: score + (timeLeft * 10),
          starsCollected: collectedItems,
          totalStars: currentLevelData?.collectibles || 0,
          timeLeft: timeLeft,
          perfectRun: collectedItems === currentLevelData?.collectibles && timeLeft > 0
        }}
      />

      <GameCompleteModal
        isOpen={gameState === 'completed'}
        onPlayAgain={handlePlayAgain}
        onMenu={handleMenu}
        finalStats={{
          totalScore: totalScore,
          totalTime: LEVELS.reduce((sum, level) => sum + level.timeLimit, 0) - timeLeft,
          levelsCompleted: LEVELS.length,
          totalStars: LEVELS.reduce((sum, level) => sum + level.collectibles, 0),
          perfectLevels: 0, // This would need to be tracked properly
          rank: 'Master'
        }}
      />

      <PauseModal
        isOpen={gameState === 'paused'}
        onResume={handlePause}
        onRestart={handleReset}
        onMenu={handleMenu}
        gameStats={{
          currentLevel: currentLevel + 1,
          score: score,
          timeLeft: timeLeft,
          starsCollected: collectedItems
        }}
      />
    </div>
  );
};

export default MazeGame;
