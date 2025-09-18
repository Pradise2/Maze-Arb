// src/hooks/useGameAnalytics.ts - Game Analytics Hook
import { useState, useCallback, useRef } from 'react';
import { GameEvent } from '../types/game.types';

interface GameAnalytics {
  events: GameEvent[];
  addEvent: (event: Omit<GameEvent, 'timestamp'>) => void;
  getSessionStats: () => {
    duration: number;
    moves: number;
    collections: number;
    deaths: number;
  };
  clearSession: () => void;
}

export const useGameAnalytics = (): GameAnalytics => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const sessionStartRef = useRef(Date.now());

  const addEvent = useCallback((event: Omit<GameEvent, 'timestamp'>) => {
    const gameEvent: GameEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    setEvents(prev => [...prev, gameEvent]);
    
    // Optional: Send to analytics service
    // analytics.track(gameEvent);
  }, []);

  const getSessionStats = useCallback(() => {
    const moves = events.filter(e => e.type === 'move').length;
    const collections = events.filter(e => e.type === 'collect').length;
    const deaths = events.filter(e => e.type === 'enemy_hit').length;
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);

    return { duration, moves, collections, deaths };
  }, [events]);

  const clearSession = useCallback(() => {
    setEvents([]);
    sessionStartRef.current = Date.now();
  }, []);

  return {
    events,
    addEvent,
    getSessionStats,
    clearSession
  };
};
