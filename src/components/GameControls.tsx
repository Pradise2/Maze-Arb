// GameControls.tsx - Game Control Interface Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Home,
  Settings,
  Volume2,
  VolumeX,
  Gamepad2,
  Smartphone,
  Keyboard
} from 'lucide-react';

// ==================== INTERFACES ====================

interface GameControlsProps {
  onMove: (dx: number, dy: number) => void;
  onPause: () => void;
  onReset: () => void;
  onMenu: () => void;
  gameState: 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'completed';
  disabled?: boolean;
  showKeyboardHints?: boolean;
  controlStyle?: 'compact' | 'comfortable' | 'large';
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

interface DirectionButtonProps {
  direction: 'up' | 'down' | 'left' | 'right';
  onPress: () => void;
  onRelease?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: 'modern' | 'classic' | 'neon';
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

type ControlScheme = 'arrows' | 'wasd' | 'touch' | 'gamepad';

// ==================== SUB-COMPONENTS ====================

const DirectionButton: React.FC<DirectionButtonProps> = ({
  direction,
  onPress,
  onRelease,
  disabled = false,
  size = 'medium',
  style = 'modern'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'p-1.5 min-w-[32px] min-h-[32px]';
      case 'large': return 'p-4 min-w-[56px] min-h-[56px]';
      default: return 'p-2 min-w-[40px] min-h-[40px]';
    }
  };

  const getStyleClasses = () => {
    const baseClasses = 'rounded-lg font-bold transition-all duration-150 flex items-center justify-center';
    
    if (disabled) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    const pressedClasses = isPressed ? 'scale-95 shadow-inner' : 'shadow-lg hover:shadow-xl';

    switch (style) {
      case 'neon':
        return `${baseClasses} bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 border-2 border-purple-300 shadow-lg shadow-purple-500/25 ${pressedClasses}`;
      case 'classic':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 border-2 border-gray-500 ${pressedClasses}`;
      default:
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 ${pressedClasses}`;
    }
  };

  const getIcon = () => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 18;
    switch (direction) {
      case 'up': return <ChevronUp size={iconSize} />;
      case 'down': return <ChevronDown size={iconSize} />;
      case 'left': return <ChevronLeft size={iconSize} />;
      case 'right': return <ChevronRight size={iconSize} />;
    }
  };

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    onPress();
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onRelease?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  };

  // Handle long press for continuous movement
  useEffect(() => {
    if (isPressed && !disabled) {
      pressTimeoutRef.current = setInterval(() => {
        onPress();
      }, 100); // Repeat every 100ms while held
    } else if (pressTimeoutRef.current) {
      clearInterval(pressTimeoutRef.current);
    }

    return () => {
      if (pressTimeoutRef.current) {
        clearInterval(pressTimeoutRef.current);
      }
    };
  }, [isPressed, disabled, onPress]);

  return (
    <button
      className={`${getSizeClasses()} ${getStyleClasses()}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      aria-label={`Move ${direction}`}
    >
      {getIcon()}
    </button>
  );
};

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'medium'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'px-2 py-1 text-xs';
      case 'large': return 'px-6 py-3 text-base';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg font-bold transition-all duration-150 flex items-center gap-2';
    
    if (disabled) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl`;
      case 'danger':
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl`;
      case 'success':
        return `${baseClasses} bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl`;
      default:
        return `${baseClasses} bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getSizeClasses()} ${getVariantClasses()}`}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// Control scheme indicator
const ControlSchemeIndicator: React.FC<{
  activeScheme: ControlScheme;
  onSchemeChange: (scheme: ControlScheme) => void;
}> = ({ activeScheme, onSchemeChange }) => {
  const schemes = [
    { key: 'arrows' as ControlScheme, icon: <Keyboard size={16} />, label: 'Arrow Keys' },
    { key: 'wasd' as ControlScheme, icon: <Gamepad2 size={16} />, label: 'WASD' },
    { key: 'touch' as ControlScheme, icon: <Smartphone size={16} />, label: 'Touch' }
  ];

  return (
    <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
      <span className="text-xs text-white/70">Control:</span>
      <div className="flex gap-1">
        {schemes.map(scheme => (
          <button
            key={scheme.key}
            onClick={() => onSchemeChange(scheme.key)}
            className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
              activeScheme === scheme.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={scheme.label}
          >
            {scheme.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// Keyboard shortcuts display
const KeyboardHints: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  const shortcuts = [
    { keys: ['↑', '↓', '←', '→'], action: 'Move' },
    { keys: ['W', 'A', 'S', 'D'], action: 'Alt Move' },
    { keys: ['SPACE'], action: 'Pause' },
    { keys: ['R'], action: 'Reset' },
    { keys: ['ESC'], action: 'Menu' }
  ];

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
      <div className="font-bold mb-2 text-center">Keyboard Shortcuts</div>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex gap-1">
              {shortcut.keys.map(key => (
                <kbd key={key} className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {key}
                </kbd>
              ))}
            </div>
            <span className="text-white/70">{shortcut.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const GameControls: React.FC<GameControlsProps> = ({
  onMove,
  onPause,
  onReset,
  onMenu,
  gameState,
  disabled = false,
  showKeyboardHints = true,
  controlStyle = 'comfortable',
  soundEnabled = true,
  onSoundToggle
}) => {
  const [activeScheme, setActiveScheme] = useState<ControlScheme>('arrows');
  const [showHints, setShowHints] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState(0);

  // Determine button sizes based on control style
  const getButtonSize = () => {
    switch (controlStyle) {
      case 'compact': return 'small' as const;
      case 'large': return 'large' as const;
      default: return 'medium' as const;
    }
  };

  // Handle movement with rate limiting
  const handleMove = useCallback((dx: number, dy: number) => {
    const now = Date.now();
    if (now - lastMoveTime < 150) return; // Rate limit to prevent too rapid movement
    
    setLastMoveTime(now);
    onMove(dx, dy);
  }, [onMove, lastMoveTime]);

  // Movement handlers
  const moveUp = useCallback(() => handleMove(0, -1), [handleMove]);
  const moveDown = useCallback(() => handleMove(0, 1), [handleMove]);
  const moveLeft = useCallback(() => handleMove(-1, 0), [handleMove]);
  const moveRight = useCallback(() => handleMove(1, 0), [handleMove]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled || gameState === 'menu') return;

      // Prevent default for game keys
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'r', 'Escape'];
      if (gameKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          moveUp();
          setActiveScheme(e.key.startsWith('Arrow') ? 'arrows' : 'wasd');
          break;
        case 'arrowdown':
        case 's':
          moveDown();
          setActiveScheme(e.key.startsWith('Arrow') ? 'arrows' : 'wasd');
          break;
        case 'arrowleft':
        case 'a':
          moveLeft();
          setActiveScheme(e.key.startsWith('Arrow') ? 'arrows' : 'wasd');
          break;
        case 'arrowright':
        case 'd':
          moveRight();
          setActiveScheme(e.key.startsWith('Arrow') ? 'arrows' : 'wasd');
          break;
        case ' ':
          if (gameState === 'playing' || gameState === 'paused') {
            onPause();
          }
          break;
        case 'r':
          onReset();
          break;
        case 'escape':
          onMenu();
          break;
        case 'h':
          setShowHints(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, gameState, moveUp, moveDown, moveLeft, moveRight, onPause, onReset, onMenu]);

  // Don't render controls on menu
  if (gameState === 'menu') return null;

  const isGameDisabled = disabled || gameState === 'lost' || gameState === 'won' || gameState === 'completed';
  const buttonSize = getButtonSize();

  return (
    <div className="flex flex-col items-center space-y-4 bg-black/30 backdrop-blur-md rounded-xl p-4 min-w-[280px]">
      
      {/* Direction Controls */}
      <div className="flex flex-col items-center space-y-1">
        
        {/* Up button */}
        <DirectionButton
          direction="up"
          onPress={moveUp}
          disabled={isGameDisabled}
          size={buttonSize}
          style="modern"
        />
        
        {/* Left, Right buttons */}
        <div className="flex space-x-1">
          <DirectionButton
            direction="left"
            onPress={moveLeft}
            disabled={isGameDisabled}
            size={buttonSize}
            style="modern"
          />
          <DirectionButton
            direction="right"
            onPress={moveRight}
            disabled={isGameDisabled}
            size={buttonSize}
            style="modern"
          />
        </div>
        
        {/* Down button */}
        <DirectionButton
          direction="down"
          onPress={moveDown}
          disabled={isGameDisabled}
          size={buttonSize}
          style="modern"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        
        {/* Pause/Resume */}
        <ActionButton
          icon={gameState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
          label={gameState === 'playing' ? 'Pause' : 'Resume'}
          onClick={onPause}
          disabled={gameState === 'lost' || gameState === 'won' || gameState === 'completed'}
          variant="primary"
          size={controlStyle === 'compact' ? 'small' : 'medium'}
        />
        
        {/* Reset */}
        <ActionButton
          icon={<RotateCcw size={16} />}
          label="Reset"
          onClick={onReset}
          variant="danger"
          size={controlStyle === 'compact' ? 'small' : 'medium'}
        />
        
        {/* Menu */}
        <ActionButton
          icon={<Home size={16} />}
          label="Menu"
          onClick={onMenu}
          variant="secondary"
          size={controlStyle === 'compact' ? 'small' : 'medium'}
        />
      </div>
      
      {/* Secondary Controls */}
      <div className="flex items-center justify-between w-full gap-2">
        
        {/* Sound Toggle */}
        {onSoundToggle && (
          <button
            onClick={onSoundToggle}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        )}
        
        {/* Control Scheme Indicator */}
        <ControlSchemeIndicator
          activeScheme={activeScheme}
          onSchemeChange={setActiveScheme}
        />
        
        {/* Hints Toggle */}
        {showKeyboardHints && (
          <button
            onClick={() => setShowHints(prev => !prev)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs"
            title="Toggle Keyboard Shortcuts"
          >
            ?
          </button>
        )}
      </div>
      
      {/* Instructions */}
      <div className="text-center text-xs text-white/70 max-w-xs">
        {activeScheme === 'arrows' && "Use arrow keys or buttons to move"}
        {activeScheme === 'wasd' && "Use WASD keys or buttons to move"}
        {activeScheme === 'touch' && "Tap buttons to move"}
      </div>
      
      {/* Keyboard Shortcuts Overlay */}
      {showHints && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <KeyboardHints visible={showHints} />
        </div>
      )}
    </div>
  );
};

// ==================== ADDITIONAL EXPORTS ====================

// Mobile-optimized controls
export const MobileGameControls: React.FC<GameControlsProps> = (props) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
      <GameControls
        {...props}
        controlStyle="large"
        showKeyboardHints={false}
      />
    </div>
  );
};

// Floating action button for quick access
export const FloatingControls: React.FC<{
  onPause: () => void;
  onReset: () => void;
  gameState: GameControlsProps['gameState'];
}> = ({ onPause, onReset, gameState }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        
        {/* Expanded controls */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-fadeIn">
            <ActionButton
              icon={gameState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
              label=""
              onClick={onPause}
              size="small"
            />
            <ActionButton
              icon={<RotateCcw size={16} />}
              label=""
              onClick={onReset}
              variant="danger"
              size="small"
            />
          </div>
        )}
        
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default GameControls;
