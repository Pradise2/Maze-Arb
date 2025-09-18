// Updated MazeGame.tsx integration with AI Enemy System

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Position, GameSettings } from '../types/game.types';

import { LEVELS, DEFAULT_SETTINGS } from '../utilities/gameConstant';
import { removeCollectible, cloneMaze } from '../utilities/mazeUtilities';
import { useGameState } from '../hooks/useGameState';
import { useGameTimer } from '../hooks/useGameTimer';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { useEnemyAI } from '../hooks/useEnemyAI';
import { useEnhancedEnemyAI } from '../hooks/useEnhancedEnemyAI';
import { useSound } from '../hooks/useSound';
import { useGameAnalytics } from '../hooks/useGameAnalytics';

import MainMenu from './MainMenu';
import MazeRenderer from './MazeRenderer';
import GameControls from './GameControls';
import GameHUD from './GameHUD';
import AIConfigPanel from './AIConfigPanel';
import { GameAnalyticsPanel } from './GameAnalyticsPanel';
import {
  GameOverModal,
  LevelCompleteModal,
  GameCompleteModal,
  PauseModal
} from './GameModals';

interface AIConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  intelligence: number;
  aggressiveness: number;
  cooperation: number;
  adaptability: number;
  costPerHour: number;
}

interface MazeGameProps {
  initialSettings?: Partial<GameSettings>;
}

const MazeGame: React.FC<MazeGameProps> = ({ initialSettings }) => {
  // Game settings with AI config
  const [settings, setSettings] = useState<GameSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  });

  // AI Configuration
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    enabled: false,
    apiKey: localStorage.getItem('maze_ai_key') || '',
    model: 'openai/gpt-3.5-turbo',
    intelligence: 60,
    aggressiveness: 60,
    cooperation: 50,
    adaptability: 55,
    costPerHour: 0.02
  });

  // Debug panels
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Current maze state
  const [currentMaze, setCurrentMaze] = useState<number[][]>([]);

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

  // Enhanced AI Enemy System (when AI is enabled)
  const enhancedEnemyAI = useEnhancedEnemyAI(
    currentMaze,
    playerPos,
    gameState,
    settings.difficulty,
    aiConfig.enabled,
    aiConfig.apiKey
  );

  // Basic Enemy AI System (fallback)
  const basicEnemyAI = useEnemyAI(
    currentMaze,
    playerPos,
    gameState,
    settings.difficulty
  );

  // Choose which AI system to use
  const activeEnemyAI = aiConfig.enabled && aiConfig.apiKey ? enhancedEnemyAI : basicEnemyAI;

  // Sound effects
  const { playSound } = useSound(settings.soundEnabled);

  // Game loop timing
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  // Performance optimization: Memoize current level data
  const currentLevelData = useMemo(() => LEVELS[currentLevel], [currentLevel]);

  // Save AI config to localStorage
  useEffect(() => {
    localStorage.setItem('maze_ai_key', aiConfig.apiKey);
  }, [aiConfig.apiKey]);

  // Update AI config cost estimation
  useEffect(() => {
    const baseRate = aiConfig.model.includes('gpt-4') ? 0.03 : 
                    aiConfig.model.includes('gpt-3.5') ? 0.015 :
                    aiConfig.model.includes('claude-3-sonnet') ? 0.003 : 0.001;
    
    const complexityMultiplier = (aiConfig.intelligence + aiConfig.aggressiveness + aiConfig.cooperation) / 300;
    const estimatedCost = baseRate * complexityMultiplier * 60; // per hour
    
    setAIConfig(prev => ({ ...prev, costPerHour: estimatedCost }));
  }, [aiConfig.model, aiConfig.intelligence, aiConfig.aggressiveness, aiConfig.cooperation]);

  // Initialize level data
  const initializeCurrentLevel = useCallback(() => {
    const level = LEVELS[currentLevel];
    if (!level) return;

    setCurrentMaze(cloneMaze(level.maze));
    setPlayerPosition(level.playerStart);
    
    // Initialize enemies with appropriate AI system
    if (aiConfig.enabled && aiConfig.apiKey) {
      enhancedEnemyAI.initializeEnemies(level.enemyPositions);
    } else {
      basicEnemyAI.resetEnemies(level.enemyPositions);
    }
    
    gameTimer.startTimer(level.timeLimit);
    setTimeLeft(level.timeLimit);
    
    analytics.addEvent({ 
      type: 'level_start', 
      data: { 
        level: currentLevel, 
        name: level.name,
        aiEnabled: aiConfig.enabled 
      } 
    });
    
    playSound('start');
  }, [currentLevel, setPlayerPosition, aiConfig.enabled, aiConfig.apiKey, enhancedEnemyAI, basicEnemyAI, gameTimer, setTimeLeft, analytics, playSound]);

  // Handle item collection
  function handleCollectItem() {
    const newMaze = removeCollectible(currentMaze, playerPos.x, playerPos.y);
    setCurrentMaze(newMaze);
    collectItem();
    
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
      
      analytics.addEvent({
        type: 'level_complete',
        data: {
          level: currentLevel,
          score,
          timeLeft,
          perfect: collectedItems === currentLevelData.collectibles,
          aiEnabled: aiConfig.enabled
        }
      });
      
      playSound('win');
    }
  }

  // Performance optimized movement handler
  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    const moved = movePlayer(dx, dy);
    if (moved) {
      analytics.addEvent({ type: 'move', data: { from: playerPos, to: { x: playerPos.x + dx, y: playerPos.y + dy } } });
      playSound('move', 0.2);
    }
  }, [gameState, movePlayer, playSound, playerPos, analytics]);

  // Other game handlers...
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

  const handleReset = useCallback(() => {
    resetLevel();
    initializeCurrentLevel();
    setGameState('playing');
    analytics.addEvent({ type: 'level_reset', data: { level: currentLevel } });
    playSound('reset');
  }, [resetLevel, initializeCurrentLevel, setGameState, analytics, currentLevel, playSound]);

  const handleMenu = useCallback(() => {
    gameTimer.stopTimer();
    setGameState('menu');
    analytics.addEvent({ type: 'return_to_menu' });
  }, [gameTimer, setGameState, analytics]);

  const handleStartGame = useCallback(() => {
    initializeLevel(0);
    initializeCurrentLevel();
    analytics.addEvent({ type: 'game_start', data: { aiEnabled: aiConfig.enabled } });
  }, [initializeLevel, initializeCurrentLevel, analytics, aiConfig.enabled]);

  const handleLevelSelect = useCallback((levelIndex: number) => {
    initializeLevel(levelIndex);
    initializeCurrentLevel();
    analytics.addEvent({ type: 'level_select', data: { level: levelIndex, aiEnabled: aiConfig.enabled } });
  }, [initializeLevel, initializeCurrentLevel, analytics, aiConfig.enabled]);

  const handleNextLevel = useCallback(() => {
    nextLevel();
    if (currentLevel + 1 < LEVELS.length) {
      setTimeout(initializeCurrentLevel, 100);
    }
  }, [nextLevel, currentLevel, initializeCurrentLevel]);

  const handlePlayAgain = useCallback(() => {
    initializeLevel(0);
    initializeCurrentLevel();
    analytics.addEvent({ type: 'play_again', data: { aiEnabled: aiConfig.enabled } });
  }, [initializeLevel, initializeCurrentLevel, analytics, aiConfig.enabled]);

  // Enhanced game loop for enemy movement and collision detection
  useEffect(() => {
    if (gameState === 'playing') {
      const intervalTime = aiConfig.enabled ? 600 : activeEnemyAI.enemyMoveInterval || 800;
      
      gameLoopRef.current = setInterval(() => {
        activeEnemyAI.updateEnemies();
        
        if (activeEnemyAI.isPlayerCaught(playerPos)) {
          setGameState('lost');
          gameTimer.stopTimer();
          analytics.addEvent({ 
            type: 'enemy_hit', 
            data: { 
              position: playerPos,
              aiEnabled: aiConfig.enabled,
              enemyType: aiConfig.enabled ? 'enhanced' : 'basic'
            } 
          });
          playSound('lose');
        }
      }, intervalTime);
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
  }, [gameState, activeEnemyAI, playerPos, setGameState, gameTimer, analytics, playSound, aiConfig.enabled]);

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

  // AI config change handler
  const handleAIConfigChange = useCallback((newConfig: AIConfig) => {
    setAIConfig(newConfig);
    
    // Reinitialize enemies if AI status changed
    if (newConfig.enabled !== aiConfig.enabled) {
      const level = LEVELS[currentLevel];
      if (level && gameState === 'playing') {
        setTimeout(() => {
          if (newConfig.enabled && newConfig.apiKey) {
            enhancedEnemyAI.initializeEnemies(level.enemyPositions);
          } else {
            basicEnemyAI.resetEnemies(level.enemyPositions);
          }
        }, 100);
      }
    }
  }, [aiConfig.enabled, currentLevel, gameState, enhancedEnemyAI, basicEnemyAI]);

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

  // Get enemy stats for AI panel
  const getEnemyStats = () => {
    if (aiConfig.enabled && 'smartEnemies' in activeEnemyAI) {
      return activeEnemyAI.smartEnemies.map(enemy => ({
        id: enemy.id,
        type: enemy.personality.type,
        state: enemy.state,
        energy: enemy.energy,
        intelligence: Math.round(enemy.personality.intelligence * 100),
        lastAction: enemy.state
      }));
    }
    return [];
  };

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
              enemies={activeEnemyAI.enemies}
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

            {/* AI Insights Panel (when AI enabled) */}
            {aiConfig.enabled && 'aiInsights' in activeEnemyAI && activeEnemyAI.aiInsights.length > 0 && (
              <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  🧠 AI Analysis
                </h3>
                <div className="space-y-1">
                  {activeEnemyAI.aiInsights.slice(-3).map((insight, index) => (
                    <div key={index} className="text-xs text-white/70">
                      • {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* AI Configuration Panel */}
      <AIConfigPanel
        config={aiConfig}
        onConfigChange={handleAIConfigChange}
        enemyStats={getEnemyStats()}
        aiInsights={'aiInsights' in activeEnemyAI ? activeEnemyAI.aiInsights : []}
        isGameActive={gameState === 'playing'}
      />

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
          perfectLevels: 0,
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
