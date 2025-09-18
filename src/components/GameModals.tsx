// GameModals.tsx - Game State Modal Components
import React, { useEffect, useState, useCallback } from 'react';
import {
  Trophy,
  Skull,
  Pause,
  Play,
  RotateCcw,
  Home,
  ChevronRight,
  Star,
  Clock,
  Target,
  Award,
  Zap,
  Crown,
  PartyPopper
} from 'lucide-react';

// ==================== INTERFACES ====================

interface BaseModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  animation?: 'fade' | 'slide' | 'bounce' | 'zoom';
}

interface GameOverModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onMenu: () => void;
  reason: 'timeout' | 'enemy' | 'quit';
  score: number;
  timeElapsed: number;
  level: number;
}

interface LevelCompleteModalProps {
  isOpen: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
  levelData: {
    number: number;
    name: string;
    score: number;
    timeBonus: number;
    totalScore: number;
    starsCollected: number;
    totalStars: number;
    timeLeft: number;
    perfectRun: boolean;
  };
}

interface GameCompleteModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
  finalStats: {
    totalScore: number;
    totalTime: number;
    levelsCompleted: number;
    totalStars: number;
    perfectLevels: number;
    rank: string;
  };
}

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  gameStats: {
    currentLevel: number;
    score: number;
    timeLeft: number;
    starsCollected: number;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
    theme: 'default' | 'neon' | 'forest' | 'space';
    controlStyle: 'compact' | 'comfortable' | 'large';
  };
  onSettingsChange: (settings: any) => void;
}

// ==================== BASE MODAL COMPONENT ====================

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  showCloseButton = false,
  closeOnBackdrop = false,
  size = 'medium',
  animation = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setTimeout(() => setIsVisible(false), 300);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'max-w-sm w-full mx-4';
      case 'large': return 'max-w-2xl w-full mx-4';
      case 'fullscreen': return 'w-full h-full m-0 rounded-none';
      default: return 'max-w-md w-full mx-4';
    }
  };

  const getAnimationClasses = () => {
    const baseTransition = 'transition-all duration-300';
    switch (animation) {
      case 'slide':
        return `${baseTransition} ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
      case 'bounce':
        return `${baseTransition} ${isOpen ? 'scale-100' : 'scale-50'} transform`;
      case 'zoom':
        return `${baseTransition} ${isOpen ? 'scale-100 opacity-100' : 'scale-110 opacity-0'} transform`;
      default:
        return `${baseTransition} ${isOpen ? 'opacity-100' : 'opacity-0'}`;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${getAnimationClasses()}`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-2xl ${getSizeClasses()} ${getAnimationClasses()}`}>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

// ==================== GAME STATE MODALS ====================

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onRetry,
  onMenu,
  reason,
  score,
  timeElapsed,
  level
}) => {
  const getReasonMessage = () => {
    switch (reason) {
      case 'timeout':
        return { title: 'Time\'s Up!', message: 'You ran out of time!', icon: <Clock size={48} className="text-orange-500" /> };
      case 'enemy':
        return { title: 'Game Over!', message: 'You were caught by an enemy!', icon: <Skull size={48} className="text-red-500" /> };
      default:
        return { title: 'Game Over!', message: 'Better luck next time!', icon: <Skull size={48} className="text-red-500" /> };
    }
  };

  const reasonData = getReasonMessage();

  return (
    <BaseModal isOpen={isOpen} animation="bounce">
      <div className="p-8 text-center">
        
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          {reasonData.icon}
        </div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {reasonData.title}
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          {reasonData.message}
        </p>
        
        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{level}</div>
              <div className="text-xs text-gray-500">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{score.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <RotateCcw size={20} />
            Try Again
          </button>
          <button
            onClick={onMenu}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <Home size={20} />
            Main Menu
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  onNextLevel,
  onReplay,
  onMenu,
  levelData
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isOpen]);

  const getPerformanceRating = () => {
    if (levelData.perfectRun) return { text: 'Perfect!', color: 'text-yellow-500', icon: <Crown size={24} /> };
    if (levelData.timeLeft > 30) return { text: 'Excellent!', color: 'text-green-500', icon: <Trophy size={24} /> };
    if (levelData.timeLeft > 10) return { text: 'Great!', color: 'text-blue-500', icon: <Award size={24} /> };
    return { text: 'Good!', color: 'text-purple-500', icon: <Target size={24} /> };
  };

  const performance = getPerformanceRating();

  return (
    <BaseModal isOpen={isOpen} animation="zoom" size="large">
      <div className="p-8 text-center relative overflow-hidden">
        
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            <PartyPopper className="absolute top-4 left-4 text-yellow-400 animate-bounce" size={24} />
            <Star className="absolute top-8 right-6 text-yellow-400 animate-ping" size={16} />
            <Trophy className="absolute bottom-8 left-8 text-gold animate-pulse" size={20} />
          </div>
        )}
        
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Trophy size={64} className="text-yellow-500" />
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
              <Star size={16} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-4xl font-bold text-gray-800 mb-2">
          Level {levelData.number} Complete!
        </h2>
        
        {/* Level Name */}
        <p className="text-xl text-gray-600 mb-2">
          "{levelData.name}"
        </p>
        
        {/* Performance Rating */}
        <div className={`flex items-center justify-center gap-2 mb-6 ${performance.color}`}>
          {performance.icon}
          <span className="text-2xl font-bold">{performance.text}</span>
        </div>
        
        {/* Detailed Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{levelData.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Base Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">+{levelData.timeBonus.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Time Bonus</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {levelData.starsCollected}/{levelData.totalStars}
              </div>
              <div className="text-sm text-gray-500">Stars</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{levelData.timeLeft}s</div>
              <div className="text-sm text-gray-500">Time Left</div>
            </div>
          </div>
          
          {/* Total Score */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">{levelData.totalScore.toLocaleString()}</div>
              <div className="text-lg text-gray-600">Total Score</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onNextLevel}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
          >
            Next Level
            <ChevronRight size={24} />
          </button>
          
          <button
            onClick={onReplay}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-bold transition-colors"
          >
            <RotateCcw size={20} />
            Replay
          </button>
          
          <button
            onClick={onMenu}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-bold transition-colors"
          >
            <Home size={20} />
            Menu
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
  isOpen,
  onPlayAgain,
  onMenu,
  finalStats
}) => {
  const getRankColor = () => {
    switch (finalStats.rank.toLowerCase()) {
      case 'master': return 'text-yellow-500';
      case 'expert': return 'text-purple-500';
      case 'advanced': return 'text-blue-500';
      case 'intermediate': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <BaseModal isOpen={isOpen} animation="zoom" size="large">
      <div className="p-8 text-center bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl">
        
        {/* Celebration Header */}
        <div className="mb-8">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-5xl font-bold mb-4">Congratulations!</h1>
          <p className="text-2xl opacity-90">You've mastered all the mazes!</p>
        </div>
        
        {/* Rank Achievement */}
        <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown size={32} className={getRankColor()} />
            <h2 className="text-3xl font-bold">Maze {finalStats.rank}</h2>
          </div>
          
          {/* Final Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">{finalStats.totalScore.toLocaleString()}</div>
              <div className="text-sm opacity-75">Total Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-300">
                {Math.floor(finalStats.totalTime / 60)}:{(finalStats.totalTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm opacity-75">Total Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300">{finalStats.levelsCompleted}</div>
              <div className="text-sm opacity-75">Levels</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">{finalStats.totalStars}</div>
              <div className="text-sm opacity-75">Stars</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300">{finalStats.perfectLevels}</div>
              <div className="text-sm opacity-75">Perfect Runs</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-300">
                {Math.round((finalStats.perfectLevels / finalStats.levelsCompleted) * 100)}%
              </div>
              <div className="text-sm opacity-75">Perfection</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
          >
            <Play size={24} />
            Play Again
          </button>
          
          <button
            onClick={onMenu}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-4 rounded-lg font-bold transition-colors backdrop-blur-md"
          >
            <Home size={20} />
            Main Menu
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onMenu,
  gameStats
}) => {
  return (
    <BaseModal isOpen={isOpen} animation="fade" closeOnBackdrop={false}>
      <div className="p-8 text-center">
        
        {/* Pause Icon */}
        <div className="mb-6 flex justify-center">
          <Pause size={48} className="text-yellow-500" />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Game Paused
        </h2>
        
        {/* Current Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{gameStats.currentLevel}</div>
              <div className="text-xs text-gray-500">Level</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{gameStats.score.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{gameStats.timeLeft}s</div>
              <div className="text-xs text-gray-500">Time Left</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">⭐{gameStats.starsCollected}</div>
              <div className="text-xs text-gray-500">Stars</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            <Play size={20} />
            Resume
          </button>
          
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <RotateCcw size={20} />
            Restart
          </button>
          
          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <Home size={20} />
            Menu
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// ==================== EXPORTS ====================

export {
  BaseModal,
  GameOverModal,
  LevelCompleteModal,
  GameCompleteModal,
  PauseModal
};

export type {
  GameOverModalProps,
  LevelCompleteModalProps,
  GameCompleteModalProps,
  PauseModalProps,
  SettingsModalProps
};
