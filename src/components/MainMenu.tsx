// MainMenu.tsx - Main Menu Component
import React, { useState, useEffect } from 'react';
import {
  Play,
  Trophy,
  Settings,
  Info,
  Star,
  Clock,
  Target,
  Gamepad2,
  Volume2,
  VolumeX,
  Palette,
  Monitor,
  Smartphone,
  Crown,
  Award,
  Zap
} from 'lucide-react';

// ==================== INTERFACES ====================

interface MainMenuProps {
  onStartGame: () => void;
  onLevelSelect?: (levelIndex: number) => void;
  highScores?: HighScore[];
  playerStats?: PlayerStats;
  settings?: GameSettings;
  onSettingsChange?: (settings: GameSettings) => void;
}

interface HighScore {
  level: number;
  score: number;
  time: number;
  stars: number;
  date: string;
  perfect: boolean;
}

interface PlayerStats {
  totalGames: number;
  totalScore: number;
  bestTime: number;
  perfectRuns: number;
  currentStreak: number;
  rank: string;
}

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'default' | 'neon' | 'forest' | 'space';
  controlStyle: 'compact' | 'comfortable' | 'large';
  animations: boolean;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

// ==================== SUB-COMPONENTS ====================

const AnimatedTitle: React.FC = () => {
  const [titleIndex, setTitleIndex] = useState(0);
  const titles = ['MAZE MASTER', '🎮 MAZE MASTER', '⭐ MAZE MASTER', '🏆 MAZE MASTER'];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % titles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <div className="mb-8 text-center">
      <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">
        {titles[titleIndex]}
      </h1>
      <p className="text-xl md:text-2xl text-white/90 font-light">
        Navigate • Collect • Escape
      </p>
      <div className="mt-4 flex justify-center space-x-4 text-white/70">
        <span className="flex items-center gap-1">
          <Target size={16} />
          Multiple Levels
        </span>
        <span className="flex items-center gap-1">
          <Star size={16} />
          Collectibles
        </span>
        <span className="flex items-center gap-1">
          <Clock size={16} />
          Time Challenges
        </span>
      </div>
    </div>
  );
};

const StartGameSection: React.FC<{
  onStartGame: () => void;
  onLevelSelect?: (levelIndex: number) => void;
}> = ({ onStartGame, onLevelSelect }) => {
  const levels = [
    { name: 'Getting Started', difficulty: 'Easy', stars: 1 },
    { name: 'The Chase', difficulty: 'Medium', stars: 3 },
    { name: 'Labyrinth Master', difficulty: 'Hard', stars: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <div className="text-center">
        <button
          onClick={onStartGame}
          className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-green-500/25"
        >
          <div className="flex items-center gap-4">
            <Play size={32} className="group-hover:animate-pulse" />
            <span>Start New Game</span>
          </div>
        </button>
      </div>

      {/* Level Select */}
      {onLevelSelect && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Select Level</h3>
          <div className="grid gap-3">
            {levels.map((level, index) => (
              <button
                key={index}
                onClick={() => onLevelSelect(index)}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all duration-200 hover:scale-102 group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-white font-bold">{level.name}</div>
                    <div className="text-white/70 text-sm">{level.difficulty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: level.stars }).map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Play size={16} className="text-white/70 group-hover:text-white" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HighScoresSection: React.FC<{ highScores?: HighScore[] }> = ({ highScores = [] }) => {
  if (highScores.length === 0) {
    return (
      <div className="text-center text-white/70 py-8">
        <Trophy size={48} className="mx-auto mb-4 opacity-50" />
        <p>No high scores yet!</p>
        <p className="text-sm">Play a game to set your first record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highScores.slice(0, 5).map((score, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              index === 0 ? 'bg-yellow-500 text-black' :
              index === 1 ? 'bg-gray-300 text-black' :
              index === 2 ? 'bg-orange-500 text-white' :
              'bg-white/20 text-white'
            }`}>
              {index + 1}
            </div>
            
            <div>
              <div className="text-white font-bold">Level {score.level}</div>
              <div className="text-white/70 text-sm flex items-center gap-2">
                <span>{score.score.toLocaleString()} pts</span>
                <span>•</span>
                <span>{Math.floor(score.time / 60)}:{(score.time % 60).toString().padStart(2, '0')}</span>
                {score.perfect && <Crown size={14} className="text-yellow-400" />}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: score.stars }).map((_, i) => (
                <Star key={i} size={14} className="text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsSection: React.FC<{ stats?: PlayerStats }> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center text-white/70 py-8">
        <Award size={48} className="mx-auto mb-4 opacity-50" />
        <p>No statistics available</p>
        <p className="text-sm">Play some games to see your progress!</p>
      </div>
    );
  }

  const getRankColor = () => {
    switch (stats.rank.toLowerCase()) {
      case 'master': return 'text-yellow-400';
      case 'expert': return 'text-purple-400';
      case 'advanced': return 'text-blue-400';
      case 'intermediate': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Rank Display */}
      <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <Crown size={48} className={`mx-auto mb-4 ${getRankColor()}`} />
        <h3 className="text-2xl font-bold text-white mb-2">Maze {stats.rank}</h3>
        <p className="text-white/70">Current Streak: {stats.currentStreak} games</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalGames}</div>
          <div className="text-white/70 text-sm">Games Played</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalScore.toLocaleString()}</div>
          <div className="text-white/70 text-sm">Total Score</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Math.floor(stats.bestTime / 60)}:{(stats.bestTime % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-white/70 text-sm">Best Time</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.perfectRuns}</div>
          <div className="text-white/70 text-sm">Perfect Runs</div>
        </div>
      </div>
    </div>
  );
};

const SettingsSection: React.FC<{
  settings?: GameSettings;
  onSettingsChange?: (settings: GameSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  if (!settings || !onSettingsChange) {
    return (
      <div className="text-center text-white/70 py-8">
        <Settings size={48} className="mx-auto mb-4 opacity-50" />
        <p>Settings not available</p>
      </div>
    );
  }

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      
      {/* Audio Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Volume2 size={20} />
          Audio
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white">Sound Effects</span>
            <button
              onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white">Background Music</span>
            <button
              onClick={() => handleSettingChange('musicEnabled', !settings.musicEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.musicEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Gameplay Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Gamepad2 size={20} />
          Gameplay
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Difficulty</label>
            <div className="flex gap-2">
              {['easy', 'normal', 'hard'].map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => handleSettingChange('difficulty', difficulty)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    settings.difficulty === difficulty
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white/70 hover:bg-white/30'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-white mb-2">Control Style</label>
            <div className="flex gap-2">
              {['compact', 'comfortable', 'large'].map((style) => (
                <button
                  key={style}
                  onClick={() => handleSettingChange('controlStyle', style)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    settings.controlStyle === style
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white/70 hover:bg-white/30'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Palette size={20} />
          Visual
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'default', name: 'Classic', color: 'bg-blue-500' },
                { key: 'neon', name: 'Neon', color: 'bg-purple-500' },
                { key: 'forest', name: 'Forest', color: 'bg-green-500' },
                { key: 'space', name: 'Space', color: 'bg-indigo-500' }
              ].map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => handleSettingChange('theme', theme.key)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    settings.theme === theme.key
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${theme.color}`} />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white">Animations</span>
            <button
              onClick={() => handleSettingChange('animations', !settings.animations)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.animations ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.animations ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HowToPlaySection: React.FC = () => {
  const instructions = [
    {
      icon: <Target size={24} className="text-blue-400" />,
      title: 'Navigate the Maze',
      description: 'Use arrow keys, WASD, or touch controls to move through the maze paths.'
    },
    {
      icon: <Star size={24} className="text-yellow-400" />,
      title: 'Collect All Stars',
      description: 'Gather all the yellow stars in each level before you can exit.'
    },
    {
      icon: <Zap size={24} className="text-red-400" />,
      title: 'Avoid Enemies',
      description: 'Red enemies patrol the maze. Don\'t let them catch you!'
    },
    {
      icon: <Clock size={24} className="text-green-400" />,
      title: 'Beat the Clock',
      description: 'Complete each level before time runs out for bonus points.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">How to Play</h3>
        <p className="text-white/70">Master these basics to become a maze champion!</p>
      </div>
      
      <div className="space-y-4">
        {instructions.map((instruction, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {instruction.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{instruction.title}</h4>
                <p className="text-white/70">{instruction.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Controls Reference */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mt-8">
        <h4 className="text-lg font-bold text-white mb-4">Controls</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white font-semibold mb-2">Keyboard</div>
            <div className="space-y-1 text-white/70">
              <div>↑↓←→ Arrow Keys - Move</div>
              <div>WASD - Alternative Move</div>
              <div>SPACE - Pause Game</div>
              <div>R - Restart Level</div>
              <div>ESC - Main Menu</div>
            </div>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Touch/Mouse</div>
            <div className="space-y-1 text-white/70">
              <div>Tap Arrow Buttons - Move</div>
              <div>Tap Action Buttons - Controls</div>
              <div>Hold Buttons - Continuous Move</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onLevelSelect,
  highScores,
  playerStats,
  settings,
  onSettingsChange
}) => {
  const [activeSection, setActiveSection] = useState('play');

  const menuSections: MenuSection[] = [
    {
      id: 'play',
      title: 'Play',
      icon: <Play size={20} />,
      component: <StartGameSection onStartGame={onStartGame} onLevelSelect={onLevelSelect} />
    },
    {
      id: 'scores',
      title: 'High Scores',
      icon: <Trophy size={20} />,
      component: <HighScoresSection highScores={highScores} />
    },
    {
      id: 'stats',
      title: 'Statistics',
      icon: <Award size={20} />,
      component: <StatsSection stats={playerStats} />
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings size={20} />,
      component: <SettingsSection settings={settings} onSettingsChange={onSettingsChange} />
    },
    {
      id: 'help',
      title: 'How to Play',
      icon: <Info size={20} />,
      component: <HowToPlaySection />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        
        {/* Animated Title */}
        <AnimatedTitle />
        
        {/* Menu Container */}
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center bg-black/30 p-4 border-b border-white/10">
            {menuSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="p-8">
            {menuSections.find(section => section.id === activeSection)?.component}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-white/50 text-sm">
          <p>Built with React + TypeScript • Powered by Fun 🎮</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
