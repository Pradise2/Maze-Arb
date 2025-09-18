
// src/types/web3.types.ts - Web3 Type Definitions
export interface ContractPlayerStats {
  totalScore: bigint;
  gamesPlayed: bigint;
  levelsCompleted: bigint;
  perfectRuns: bigint;
  bestTime: bigint;
  currentStreak: bigint;
  lastPlayTime: bigint;
  isActive: boolean;
}

export interface ContractLevelScore {
  score: bigint;
  timeCompleted: bigint;
  starsCollected: bigint;
  isPerfect: boolean;
  timestamp: bigint;
}

export interface Web3GameState {
  isConnected: boolean;
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  balance: bigint;
  playerStats: ContractPlayerStats | null;
  pendingRewards: bigint;
  isLoading: boolean;
  error: string | null;
}
