// hooks/useGameTimer.ts - Fixed Type Import
import { useState, useEffect, useRef, useCallback } from 'react';

// Define GameState locally to avoid import issues
type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'completed';

interface GameTimer {
  timeLeft: number;
  isRunning: boolean;
  startTimer: (initialTime: number) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: (time: number) => void;
  addTime: (seconds: number) => void;
  formatTime: (seconds: number) => string;
}

export const useGameTimer = (
  onTimeUp: () => void,
  gameState: GameState
): GameTimer => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const startTimer = useCallback((initialTime: number) => {
    setTimeLeft(initialTime);
    setIsRunning(true);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const pauseTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      pausedTimeRef.current = Date.now();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    }
  }, [isRunning]);

  const resumeTimer = useCallback(() => {
    if (!isRunning && pausedTimeRef.current > 0) {
      setIsRunning(true);
      const pausedDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pausedDuration;
      pausedTimeRef.current = 0;
    }
  }, [isRunning]);

  const resetTimer = useCallback((time: number) => {
    stopTimer();
    setTimeLeft(time);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, [stopTimer]);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft(prev => Math.max(0, prev + seconds));
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [gameState, isRunning, onTimeUp]);

  // Auto-pause/resume based on game state
  useEffect(() => {
    if (gameState === 'paused') {
      pauseTimer();
    } else if (gameState === 'playing' && pausedTimeRef.current > 0) {
      resumeTimer();
    }
  }, [gameState, pauseTimer, resumeTimer]);

  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    addTime,
    formatTime
  };
};
