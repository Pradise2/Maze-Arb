export interface Position {
  x: number;
  y: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'completed';

export interface Level {
  id: number;
  name: string;
  maze: number[][];
  timeLimit: number;
  playerStart: Position;
  enemiesStart: Position[];
  collectibles: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'default' | 'neon' | 'forest' | 'space';
  controlStyle: 'compact' | 'comfortable' | 'large';
  animations: boolean;
}

export interface PlayerStats {
  totalGames: number;
  totalScore: number;
  bestTime: number;
  perfectRuns: number;
  currentStreak: number;
  rank: string;
}

export interface HighScore {
  level: number;
  score: number;
  time: number;
  stars: number;
  date: string;
  perfect: boolean;
};
