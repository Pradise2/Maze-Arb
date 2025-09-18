
// src/utilities/gameConstant.ts - Game Constants and Levels
// src/utilities/gameConstant.ts - Game Constants and Levels
import type { Level } from '../types/game.types';

export const GAME_CONFIG = {
  CELL_SIZE: 24,
  MIN_CELL_SIZE: 16,
  MAX_CELL_SIZE: 32,
  MOVE_COOLDOWN: 150,
  ENEMY_MOVE_INTERVAL: {
    easy: 1200,
    normal: 800,
    hard: 500
  },
  SCORE: {
    COLLECTIBLE: 100,
    TIME_BONUS: 10,
    LEVEL_COMPLETE: 500,
    PERFECT_BONUS: 1000
  },
  DIFFICULTY_MODIFIERS: {
    easy: {
      timeMultiplier: 1.5,
      enemySpeed: 0.7,
      chaseChance: 0.2
    },
    normal: {
      timeMultiplier: 1.0,
      enemySpeed: 1.0,
      chaseChance: 0.3
    },
    hard: {
      timeMultiplier: 0.8,
      enemySpeed: 1.3,
      chaseChance: 0.4
    }
  }
};

// Level data
export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Getting Started",
    timeLimit: 60,
    collectibles: 1,
    enemyCount: 0,
    playerStart: { x: 1, y: 1 },
    exitPosition: { x: 7, y: 7 },
    enemyPositions: [],
    maze: [
      [1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,1],
      [1,0,1,0,1,0,1,4,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,1],
      [1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    id: 2,
    name: "The Chase",
    timeLimit: 90,
    collectibles: 3,
    enemyCount: 2,
    playerStart: { x: 1, y: 1 },
    exitPosition: { x: 11, y: 9 },
    enemyPositions: [{ x: 6, y: 3 }, { x: 9, y: 7 }],
    maze: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,1,4,1],
      [1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,1,1,1,1,1,0,1,4,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,1,1,1,1,1,0,1],
      [1,4,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    id: 3,
    name: "Labyrinth Master",
    timeLimit: 120,
    collectibles: 5,
    enemyCount: 3,
    playerStart: { x: 1, y: 1 },
    exitPosition: { x: 13, y: 11 },
    enemyPositions: [{ x: 4, y: 4 }, { x: 8, y: 6 }, { x: 10, y: 9 }],
    maze: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,4,1],
      [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,0,1,1,1,0,1,1,4,1],
      [1,0,0,0,0,0,0,1,0,0,0,1,0,0,1],
      [1,0,1,1,1,1,0,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,4,1,1,1,0,1,1,0,1,1,1,1,4,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  }
];

// Default settings
export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: false,
  difficulty: 'normal' as const,
  theme: 'default' as const,
  controlStyle: 'comfortable' as const,
  animations: true
};

// Theme configurations
export const THEMES = {
  default: {
    name: 'Classic',
    primary: '#3b82f6',
    secondary: '#1f2937',
    accent: '#10b981'
  },
  neon: {
    name: 'Neon',
    primary: '#a855f7',
    secondary: '#1a1a2e',
    accent: '#06d6a0'
  },
  forest: {
    name: 'Forest',
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#f59e0b'
  },
  space: {
    name: 'Space',
    primary: '#6366f1',
    secondary: '#0f172a',
    accent: '#ec4899'
  }
};

// Achievement ranks
export const RANKS = [
  { name: 'Beginner', minScore: 0, color: '#6b7280' },
  { name: 'Novice', minScore: 1000, color: '#059669' },
  { name: 'Intermediate', minScore: 2500, color: '#0ea5e9' },
  { name: 'Advanced', minScore: 5000, color: '#8b5cf6' },
  { name: 'Expert', minScore: 10000, color: '#f59e0b' },
  { name: 'Master', minScore: 20000, color: '#dc2626' }
];

// Sound effect mappings
export const SOUNDS = {
  move: { frequency: 200, duration: 0.1, volume: 0.3 },
  collect: { frequencies: [523, 659], duration: 0.2, volume: 0.5 },
  win: { frequencies: [523, 659, 784], duration: 0.3, volume: 0.7 },
  lose: { frequencies: [196, 147], duration: 0.5, volume: 0.6 },
  pause: { frequency: 400, duration: 0.2, volume: 0.4 },
  enemy: { frequency: 150, duration: 0.3, volume: 0.5 }
};

// Control mappings
export const CONTROLS = {
  keyboard: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    pause: ['Space'],
    reset: ['KeyR'],
    menu: ['Escape']
  },
  gamepad: {
    up: [12],
    down: [13],
    left: [14],
    right: [15],
    pause: [9],
    reset: [1],
    menu: [8]
  }
};

// Animation configurations
export const ANIMATIONS = {
  player: 'animate-pulse',
  enemy: 'animate-bounce',
  collectible: 'animate-spin',
  exit: 'animate-ping',
  explosion: 'animate-pulse'
};

export const MAZE_GENERATION = {
  MIN_SIZE: 9,
  MAX_SIZE: 21,
  WALL_DENSITY: 0.3,
  PATH_WIDTH: 1
};
