// src/components/MazeGame.tsx - Enhanced with Performance Optimizations
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Position, GameSettings } from '../types/game.types';

import { LEVELS, DEFAULT_SETTINGS } from '../utilities/gameConstant';
import { removeCollectible, cloneMaze } from '../utilities/mazeUtilities';
import { useGameState } from '../hooks/useGameState';
import { useGameTimer } from '../hooks/useGameTimer';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { useEnemyAI } from '../hooks/useEnemyAI';
import { useSound } from '../hooks/useSound';
import { useGameAnalytics } from '../hooks/useGameAnalytics';

import MainMenu from './MainMenu';
import MazeRenderer from './MazeRenderer';
import GameControls from './GameControls';
import GameHUD from './GameHUD';
import { GameAnalyticsPanel } from './GameAnalyticsPanel';
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

  // Debug panel state
  const [showAnalytics, setShowAnalytics] = useState(false);

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
    collectItem,
    setTimeLeft,
    initializeLevel,
    canExitLevel
  } = gameStateHook;

  // Game analytics
  const analytics = useGameAnalytics();

  // Game timer
  const gameTimer = useGameTimer(
    () => {
      setGameState('lost');
      analytics.addEvent({ type: 'game_over', data: { reason: 'timeout' } });
    },
    gameState
  );

  // Player movement
  const playerMovement = usePlayerMovement(
    currentMaze,
    handleCollectItem,
    handleReachExit,
    gameState
  );
  const { playerPos, movePlayer, setPlayerPosition } = playerMovement;

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
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  // Performance optimization: Memoize current level data
  const currentLevelData = useMemo(() => LEVELS[currentLevel], [currentLevel]);

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
    
    // Analytics
    analytics.addEvent({ 
      type: 'level_start', 
      data: { level: currentLevel, name: level.name } 
    });
    
    playSound('start');
  }, [currentLevel, setPlayerPosition, resetEnemies, gameTimer, setTimeLeft, analytics, playSound]);

  // Handle item collection
  function handleCollectItem() {
    const newMaze = removeCollectible(currentMaze, playerPos.x, playerPos.y);
    setCurrentMaze(newMaze);
    collectItem();
    
    // Analytics
    analytics.addEvent({ 
      type: 'collect',
      data: { position: playerPos, remaining: currentLevelData.collectibles - collectedItems - 1 }
    });
    
    playSound('collect');
  }

  // Handle reaching exit
  function handleReachExit() {
    if (canExitLevel()) {
      setGameState('won');
      gameTimer.stopTimer();
      
      // Analytics
      analytics.addEvent({
        type: 'level_complete',
        data: {
          level: currentLevel,
          score,
          timeLeft,
          perfect: collectedItems === currentLevelData.collectibles
        }
      });
      
      playSound('win');
    }
  }

  // Performance optimized movement handler
  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    // Rate limiting
    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    const moved = movePlayer(dx, dy);
    if (moved) {
      analytics.addEvent({ type: 'move', data: { from: playerPos, to: { x: playerPos.x + dx, y: playerPos.y + dy } } });
      playSound('move', 0.2);
    }
  }, [gameState, movePlayer, playSound, playerPos, analytics]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      gameTimer.pauseTimer();
      analytics.addEvent({ type: 'pause' });
      playSound('pause');
    } else if (gameState === 'paused') {
      setGameState('playing');
      gameTimer.resumeTimer();
      analytics.addEvent({ type: 'resume' });
    }
  }, [gameState, setGameState, gameTimer, analytics, playSound]);

  // Handle level reset
  const handleReset = useCallback(() => {
    resetLevel();
    initializeCurrentLevel();
    setGameState('playing');
    analytics.addEvent({ type: 'level_reset', data: { level: currentLevel } });
    playSound('reset');
  }, [resetLevel, initializeCurrentLevel, setGameState, analytics, currentLevel, playSound]);

  // Handle return to menu
  const handleMenu = useCallback(() => {
    gameTimer.stopTimer();
    setGameState('menu');
    analytics.addEvent({ type: 'return_to_menu' });
  }, [gameTimer, setGameState, analytics]);

  // Handle start game
  const handleStartGame = useCallback(() => {
    initializeLevel(0);
    initializeCurrentLevel();
    analytics.addEvent({ type: 'game_start' });
  }, [initializeLevel, initializeCurrentLevel, analytics]);

  // Handle level select
  const handleLevelSelect = useCallback((levelIndex: number) => {
    initializeLevel(levelIndex);
    initializeCurrentLevel();
    analytics.addEvent({ type: 'level_select', data: { level: levelIndex } });
  }, [initializeLevel, initializeCurrentLevel, analytics]);

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
    analytics.addEvent({ type: 'play_again' });
  }, [initializeLevel, initializeCurrentLevel, analytics]);

  // Optimized game loop for enemy movement and collision detection
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        // Update enemies
        updateEnemies();
        
        // Check for player-enemy collision
        if (isPlayerCaught(playerPos)) {
          setGameState('lost');
          gameTimer.stopTimer();
          analytics.addEvent({ type: 'enemy_hit', data: { position: playerPos } });
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
  }, [gameState, updateEnemies, isPlayerCaught, playerPos, setGameState, gameTimer, analytics, playSound, enemyAI.enemyMoveInterval]);

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

  // Calculate remaining collectibles
  const remainingCollectibles = currentLevelData ? 
    currentLevelData.collectibles - collectedItems : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Game HUD */}
        <GameHUD
          currentLevel={currentLevel}
          totalLevels={LEVELS.length}
          levelName={currentLevelData?.name || 'Unknown Level'}
          score={score}
          timeLeft={timeLeft}
          collectedItems={collectedItems}
          totalCollectibles={currentLevelData?.collectibles || 0}
          totalScore={totalScore}
          gameState={gameState}
        />

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

        {/* Game Status Overlay */}
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

      {/* Analytics Panel (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <GameAnalyticsPanel
          analytics={analytics}
          isVisible={showAnalytics}
          onToggle={() => setShowAnalytics(!showAnalytics)}
        />
      )}

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
          perfectLevels: 0, // This would need proper tracking
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
