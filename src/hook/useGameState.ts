// src/hook/useGameState.ts - Game State Management Hook
import { useState, useCallback, useEffect } from 'react';
import { GameState, Level } from '../types/game.types';

interface GameStateHook {
  gameState: GameState;
  currentLevel: number;
  score: number;
  totalScore: number;
  collectedItems: number;
  timeLeft: number;
  setGameState: (state: GameState) => void;
  nextLevel: () => void;
  resetLevel: () => void;
  addScore: (points: number) => void;
  collectItem: () => void;
  setTimeLeft: (time: number) => void;
  initializeLevel: (levelIndex: number) => void;
  canExitLevel: () => boolean;
}

export const useGameState = (levels: Level[]): GameStateHook => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [collectedItems, setCollectedItems] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const initializeLevel = useCallback((levelIndex: number) => {
    if (levelIndex >= levels.length) {
      setGameState('completed');
      return;
    }
    
    const level = levels[levelIndex];
    setCurrentLevel(levelIndex);
    setTimeLeft(level.timeLimit);
    setCollectedItems(0);
    setScore(0);
    setGameState('playing');
  }, [levels]);

  const nextLevel = useCallback(() => {
    const timeBonus = timeLeft * 10;
    const levelScore = score + timeBonus;
    setTotalScore(prev => prev + levelScore);
    
    if (currentLevel + 1 >= levels.length) {
      setGameState('completed');
    } else {
      initializeLevel(currentLevel + 1);
    }
  }, [currentLevel, score, timeLeft, levels, initializeLevel]);

  const resetLevel = useCallback(() => {
    initializeLevel(currentLevel);
  }, [currentLevel, initializeLevel]);

  const addScore = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  const collectItem = useCallback(() => {
    setCollectedItems(prev => prev + 1);
    addScore(100);
  }, [addScore]);

  const canExitLevel = useCallback(() => {
    const level = levels[currentLevel];
    return level ? collectedItems >= level.collectibles : false;
  }, [levels, currentLevel, collectedItems]);

  // Auto-complete level when exiting with all items
  useEffect(() => {
    if (canExitLevel() && gameState === 'playing') {
      // This will be triggered by the main component when player reaches exit
    }
  }, [canExitLevel, gameState]);

  return {
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
  };
};
