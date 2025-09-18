// components/AIConfigPanel.tsx - AI Configuration Interface
import React, { useState } from 'react';
import { Brain, Zap, Eye, Shield, Users, Settings, Info, AlertTriangle } from 'lucide-react';

interface AIConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  intelligence: number; // 0-100
  aggressiveness: number; // 0-100
  cooperation: number; // 0-100
  adaptability: number; // 0-100
  costPerHour: number;
}

interface EnemyStats {
  id: string;
  type: string;
  state: string;
  energy: number;
  intelligence: number;
  lastAction: string;
}

interface AIConfigPanelProps {
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  enemyStats: EnemyStats[];
  aiInsights: string[];
  isGameActive: boolean;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({
  config,
  onConfigChange,
  enemyStats,
  aiInsights,
  isGameActive
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const getPersonalityIcon = (type: string) => {
    switch (type) {
      case 'hunter': return '🎯';
      case 'guardian': return '🛡️';
      case 'scout': return '👁️';
      case 'ambusher': return '🕷️';
      case 'swarm': return '🐝';
      default: return '👾';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'chasing': return 'text-red-400';
      case 'searching': return 'text-yellow-400';
      case 'patrolling': return 'text-blue-400';
      case 'ambushing': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className={`p-3 rounded-lg shadow-lg transition-all duration-200 ${
            config.enabled 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="AI Enemy Configuration"
        >
          <Brain size={24} />
          {config.enabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-purple-400" />
          <h3 className="text-white font-bold">AI Enemy Control</h3>
          {config.enabled && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
              ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Enable AI Enemies</span>
          <button
            onClick={() => handleConfigChange('enabled', !config.enabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {config.enabled && (
          <>
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="sk-or-..."
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Get your key from{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" 
                   className="text-purple-400 hover:underline">
                  openrouter.ai
                </a>
              </p>
            </div>

            {/* AI Personality Sliders */}
            <div className="space-y-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Settings size={16} />
                AI Personality
              </h4>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Intelligence</span>
                  <span className="text-purple-400">{config.intelligence}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.intelligence}
                  onChange={(e) => handleConfigChange('intelligence', parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Aggressiveness</span>
                  <span className="text-red-400">{config.aggressiveness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.aggressiveness}
                  onChange={(e) => handleConfigChange('aggressiveness', parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Cooperation</span>
                  <span className="text-blue-400">{config.cooperation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.cooperation}
                  onChange={(e) => handleConfigChange('cooperation', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Enemy Status Display */}
            {isGameActive && enemyStats.length > 0 && (
              <div>
                <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                  <Eye size={16} />
                  Enemy Status ({enemyStats.length})
                </h4>
                <div className="space-y-2">
                  {enemyStats.map((enemy, index) => (
                    <div key={enemy.id} className="bg-gray-800 rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPersonalityIcon(enemy.type)}</span>
                          <span className="text-white text-sm
