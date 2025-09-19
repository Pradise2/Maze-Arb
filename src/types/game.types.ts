// src/types/game.types.ts - Game Type Definitions (Corrected)

export interface Position {
  x: number;
  y: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'completed';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Theme = 'default' | 'neon' | 'forest' | 'space';
export type ControlStyle = 'compact' | 'comfortable' | 'large';

export interface Level {
  id: number;
  name: string;
  maze: number[][];
  timeLimit: number;
  collectibles: number;
  enemyCount: number;
  enemyPositions: Position[];
  playerStart: Position;
  exitPosition: Position;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: Difficulty;
  theme: Theme;
  controlStyle: ControlStyle;
  animations: boolean;
}

export interface HighScore {
  level: number;
  score: number;
  time: number;
  stars: number;
  date: string;
  perfect: boolean;
}

export interface PlayerStats {
  totalGames: number;
  totalScore: number;
  bestTime: number;
  perfectRuns: number;
  currentStreak: number;
  rank: string;
}

export interface GameStats {
  currentLevel: number;
  score: number;
  timeLeft: number;
  starsCollected: number;
  totalStars: number;
  lives: number;
  perfectRun: boolean;
}

export interface LevelStats {
  number: number;
  name: string;
  score: number;
  timeBonus: number;
  totalScore: number;
  starsCollected: number;
  totalStars: number;
  timeLeft: number;
  perfectRun: boolean;
}

export interface FinalStats {
  totalScore: number;
  totalTime: number;
  levelsCompleted: number;
  totalStars: number;
  perfectLevels: number;
  rank: string;
}

export const CELL_TYPES = {
  PATH: 0,
  WALL: 1,
  PLAYER: 2,
  EXIT: 3,
  COLLECTIBLE: 4,
  ENEMY: 5
} as const;

export type CellType = typeof CELL_TYPES[keyof typeof CELL_TYPES];

export interface GameEvent {
  type: 'move' | 'collect' | 'enemy_hit' | 'level_complete' | 'game_over' | 'level_start' | 'game_start' | 'pause' | 'resume' | 'level_reset' | 'return_to_menu' | 'level_select' | 'play_again';
  timestamp: number;
  data?: any;
}

export interface Enemy {
  id: string;
  position: Position;
  lastMove: number;
  behavior: 'patrol' | 'chase' | 'guard';
  speed: number;
}

export interface CollisionResult {
  collision: boolean;
  type: 'wall' | 'enemy' | 'collectible' | 'exit' | 'boundary';
  position?: Position;
}