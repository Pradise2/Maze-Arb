// src/hooks/useGamePersistence.ts - Local Storage for Game Progress
import { useState, useEffect, useCallback } from 'react';
import { GameSettings, HighScore, PlayerStats } from '../types/game.types';
import { DEFAULT_SETTINGS } from '../utilities/gameConstant';

interface GamePersistence {
  settings: GameSettings;
  highScores: HighScore[];
  playerStats: PlayerStats;
  updateSettings: (settings: GameSettings) => void;
  addHighScore: (score: HighScore) => void;
  updateStats: (stats: Partial<PlayerStats>) => void;
  clearData: () => void;
}

export const useGamePersistence = (): GamePersistence => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalGames: 0,
    totalScore: 0,
    bestTime: Infinity,
    perfectRuns: 0,
    currentStreak: 0,
    rank: 'Beginner'
  });

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('mazeGame_settings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }

      const savedScores = localStorage.getItem('mazeGame_highScores');
      if (savedScores) {
        setHighScores(JSON.parse(savedScores));
      }

      const savedStats = localStorage.getItem('mazeGame_playerStats');
      if (savedStats) {
        setPlayerStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.warn('Failed to load game data from localStorage:', error);
    }
  }, []);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('mazeGame_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, []);

  const addHighScore = useCallback((score: HighScore) => {
    setHighScores(prev => {
      const updated = [...prev, score]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Keep top 10
      
      try {
        localStorage.setItem('mazeGame_highScores', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save high score:', error);
      }
      
      return updated;
    });
  }, []);

  const updateStats = useCallback((statsUpdate: Partial<PlayerStats>) => {
    setPlayerStats(prev => {
      const updated = { ...prev, ...statsUpdate };
      
      // Calculate rank based on total score
      if (updated.totalScore >= 20000) updated.rank = 'Master';
      else if (updated.totalScore >= 10000) updated.rank = 'Expert';
      else if (updated.totalScore >= 5000) updated.rank = 'Advanced';
      else if (updated.totalScore >= 2500) updated.rank = 'Intermediate';
      else if (updated.totalScore >= 1000) updated.rank = 'Novice';
      else updated.rank = 'Beginner';
      
      try {
        localStorage.setItem('mazeGame_playerStats', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save player stats:', error);
      }
      
      return updated;
    });
  }, []);

  const clearData = useCallback(() => {
    localStorage.removeItem('mazeGame_settings');
    localStorage.removeItem('mazeGame_highScores');
    localStorage.removeItem('mazeGame_playerStats');
    setSettings(DEFAULT_SETTINGS);
    setHighScores([]);
    setPlayerStats({
      totalGames: 0,
      totalScore: 0,
      bestTime: Infinity,
      perfectRuns: 0,
      currentStreak: 0,
      rank: 'Beginner'
    });
  }, []);

  return {
    settings,
    highScores,
    playerStats,
    updateSettings,
    addHighScore,
    updateStats,
    clearData
  };
};
