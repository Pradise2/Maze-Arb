// MazeRenderer.tsx - Fixed Type Issues
import React  from 'react';

// ==================== INTERFACES ====================

interface Position {
  x: number;
  y: number;
}

interface MazeRendererProps {
  maze: number[][];
  playerPos: Position;
  enemies?: Position[];
  cellSize?: number;
  showGrid?: boolean;
  animations?: boolean;
  theme?: 'default' | 'neon' | 'forest' | 'space';
  onCellClick?: (x: number, y: number) => void;
}

// ==================== CONSTANTS ====================

const CELL_TYPES = {
  PATH: 0,
  WALL: 1,
  PLAYER: 2,
  EXIT: 3,
  COLLECTIBLE: 4,
  ENEMY: 5
} as const;

type CellType = typeof CELL_TYPES[keyof typeof CELL_TYPES];

interface CellProps {
  type: CellType;
  x: number;
  y: number;
  cellSize: number;
  hasPlayer: boolean;
  hasEnemy: boolean;
  theme: string;
  showGrid: boolean;
  animations: boolean;
  onClick?: () => void;
}

// Theme configurations
const THEMES = {
  default: {
    wall: 'bg-gray-800 border-gray-700',
    path: 'bg-gray-100 border-gray-200',
    exit: 'bg-green-400 border-green-300',
    collectible: 'bg-yellow-300 border-yellow-200',
    player: 'bg-blue-500 border-blue-400',
    enemy: 'bg-red-500 border-red-400',
    grid: 'border-gray-300'
  },
  neon: {
    wall: 'bg-purple-900 border-purple-700 shadow-lg shadow-purple-500/20',
    path: 'bg-gray-900 border-cyan-800',
    exit: 'bg-green-400 border-green-300 shadow-lg shadow-green-400/50',
    collectible: 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50',
    player: 'bg-cyan-400 border-cyan-300 shadow-lg shadow-cyan-400/50',
    enemy: 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50',
    grid: 'border-cyan-700'
  },
  forest: {
    wall: 'bg-green-900 border-green-800',
    path: 'bg-green-50 border-green-100',
    exit: 'bg-amber-400 border-amber-300',
    collectible: 'bg-orange-400 border-orange-300',
    player: 'bg-blue-600 border-blue-500',
    enemy: 'bg-red-700 border-red-600',
    grid: 'border-green-200'
  },
  space: {
    wall: 'bg-indigo-950 border-indigo-800',
    path: 'bg-slate-900 border-slate-800',
    exit: 'bg-emerald-400 border-emerald-300',
    collectible: 'bg-yellow-400 border-yellow-300',
    player: 'bg-blue-400 border-blue-300',
    enemy: 'bg-red-600 border-red-500',
    grid: 'border-slate-700'
  }
};

const CELL_CONTENT: Record<CellType, string> = {
  [CELL_TYPES.WALL]: '',
  [CELL_TYPES.PATH]: '',
  [CELL_TYPES.EXIT]: '🚪',
  [CELL_TYPES.COLLECTIBLE]: '⭐',
  [CELL_TYPES.PLAYER]: '😊',
  [CELL_TYPES.ENEMY]: '👾'
};

// ==================== SUB-COMPONENTS ====================

const MazeCell: React.FC<CellProps> = ({
  type,
  x,
  y,
  cellSize,
  hasPlayer,
  hasEnemy,
  theme,
  showGrid,
  animations,
  onClick
}) => {
  const themeConfig = THEMES[theme as keyof typeof THEMES] || THEMES.default;
  
  const getCellClasses = (): string => {
    let baseClasses = `relative flex items-center justify-center text-xs font-bold transition-all duration-200`;
    
    if (cellSize <= 16) baseClasses += ' text-[8px]';
    else if (cellSize <= 24) baseClasses += ' text-xs';
    else baseClasses += ' text-sm';
    
    if (showGrid) {
      baseClasses += ` border ${themeConfig.grid}`;
    }
    
    if (onClick) {
      baseClasses += ' cursor-pointer hover:opacity-80';
    }
    
    if (animations) {
      baseClasses += ' hover:scale-105';
    }
    
    if (hasPlayer) {
      baseClasses += ` ${themeConfig.player} rounded-full`;
      if (animations) baseClasses += ' animate-pulse';
    } else if (hasEnemy) {
      baseClasses += ` ${themeConfig.enemy} rounded-full`;
      if (animations) baseClasses += ' animate-bounce';
    } else {
      switch (type) {
        case CELL_TYPES.WALL:
          baseClasses += ` ${themeConfig.wall}`;
          break;
        case CELL_TYPES.PATH:
          baseClasses += ` ${themeConfig.path}`;
          break;
        case CELL_TYPES.EXIT:
          baseClasses += ` ${themeConfig.exit}`;
          if (animations) baseClasses += ' animate-pulse';
          break;
        case CELL_TYPES.COLLECTIBLE:
          baseClasses += ` ${themeConfig.collectible} rounded-full`;
          if (animations) baseClasses += ' animate-spin';
          break;
        default:
          baseClasses += ` ${themeConfig.path}`;
      }
    }
    
    return baseClasses;
  };
  
  const getCellContent = (): string => {
    if (hasPlayer) return CELL_CONTENT[CELL_TYPES.PLAYER];
    if (hasEnemy) return CELL_CONTENT[CELL_TYPES.ENEMY];
    return CELL_CONTENT[type] || '';
  };
  
  const getSpecialEffects = () => {
    if (type === CELL_TYPES.EXIT && animations) {
      return <div className="absolute inset-0 bg-green-400/20 rounded animate-ping" />;
    }
    
    if (type === CELL_TYPES.COLLECTIBLE && animations) {
      return <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-pulse" />;
    }
    
    if (hasPlayer && animations) {
      return <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping" />;
    }
    
    return null;
  };
  
  return (
    <div
      className={getCellClasses()}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        minWidth: `${cellSize}px`,
        minHeight: `${cellSize}px`
      }}
      onClick={onClick}
      title={`Cell (${x}, ${y})`}
    >
      {getSpecialEffects()}
      <span className="relative z-10">
        {getCellContent()}
      </span>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const MazeRenderer: React.FC<MazeRendererProps> = ({
  maze,
  playerPos,
  enemies = [],
  cellSize = 20,
  showGrid = false,
  animations = true,
  theme = 'default',
  onCellClick
}) => {
  const isValidMaze = maze && maze.length > 0 && maze[0] && maze[0].length > 0;
  
  if (!isValidMaze) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🎮</div>
          <div>Loading maze...</div>
        </div>
      </div>
    );
  }
  
  const hasPlayer = (x: number, y: number): boolean => 
    playerPos.x === x && playerPos.y === y;
    
  const hasEnemy = (x: number, y: number): boolean =>
    enemies.some(enemy => enemy.x === x && enemy.y === y);
  
  const getCellType = (cellValue: number): CellType => {
    if (Object.values(CELL_TYPES).includes(cellValue as CellType)) {
      return cellValue as CellType;
    }
    return CELL_TYPES.WALL;
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="maze-container bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200">
        <div 
          className="maze-grid relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${maze[0].length}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${maze.length}, ${cellSize}px)`,
            gap: showGrid ? '1px' : '0px'
          }}
        >
          {maze.map((row, y) =>
            row.map((cellValue, x) => (
              <MazeCell
                key={`cell-${x}-${y}`}
                type={getCellType(cellValue)}
                x={x}
                y={y}
                cellSize={cellSize}
                hasPlayer={hasPlayer(x, y)}
                hasEnemy={hasEnemy(x, y)}
                theme={theme}
                showGrid={showGrid}
                animations={animations}
                onClick={onCellClick ? () => onCellClick(x, y) : undefined}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <span>😊</span>
          <span>Player</span>
        </div>
        <div className="flex items-center gap-1">
          <span>👾</span>
          <span>Enemy</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>Star</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🚪</span>
          <span>Exit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-800 rounded"></div>
          <span>Wall</span>
        </div>
      </div>
    </div>
  );
};

export default MazeRenderer;
