// src/components/GameAnalyticsPanel.tsx - Debug Panel for Analytics
import React from 'react';
import type { GameAnalytics } from '../hooks/useGameAnalytics';

interface GameAnalyticsPanelProps {
  analytics: GameAnalytics;
  isVisible: boolean;
  onToggle: () => void;
}

export const GameAnalyticsPanel: React.FC<GameAnalyticsPanelProps> = ({
  analytics,
  isVisible,
  onToggle
}) => {
  const stats = analytics.getSessionStats();

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-lg text-xs opacity-50 hover:opacity-100"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Session Analytics</h3>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        <div>Duration: {Math.floor(stats.duration / 60)}m {stats.duration % 60}s</div>
        <div>Moves: {stats.moves}</div>
        <div>Collections: {stats.collections}</div>
        <div>Deaths: {stats.deaths}</div>
        <div>Events: {analytics.events.length}</div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={analytics.clearSession}
          className="mt-2 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Session
        </button>
      )}
    </div>
  );
};
