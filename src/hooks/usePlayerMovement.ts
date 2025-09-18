
// hooks/usePlayerMovement.ts - Player Movement Logic Hook
import { useState, useCallback, useRef } from 'react';
import type { GameState } from '../types/game.types';

interface Position {
  x: number;
  y: number;
}

const CELL_TYPES = {
  WALL: 1,
  PATH: 0,
  PLAYER: 2,
  EXIT: 3,
  COLLECTIBLE: 4,
  ENEMY: 5
} as const;

interface MovementHook {
  playerPos: Position;
  movePlayer: (dx: number, dy: number) => boolean;
  setPlayerPosition: (pos: Position) => void;
  getValidMoves: () => Position[];
  isValidMove: (x: number, y: number) => boolean;
  resetPosition: (initialPos: Position) => void;
}

export const usePlayerMovement = (
  maze: number[][],
  onCollectItem: () => void,
  onReachExit: () => void,
  gameState: GameState
): MovementHook => {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const lastMoveTime = useRef(0);
  const MOVE_COOLDOWN = 150; // Prevent too rapid movement

  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (!maze || maze.length === 0) return false;
    
    // Check bounds
    if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) {
      return false;
    }
    
    // Check for walls
    return maze[y][x] !== CELL_TYPES.WALL;
  }, [maze]);

  const getValidMoves = useCallback((): Position[] => {
    const moves: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];

    directions.forEach(dir => {
      const newX = playerPos.x + dir.x;
      const newY = playerPos.y + dir.y;
      if (isValidMove(newX, newY)) {
        moves.push({ x: newX, y: newY });
      }
    });

    return moves;
  }, [playerPos, isValidMove]);

  const movePlayer = useCallback((dx: number, dy: number): boolean => {
    if (gameState !== 'playing') return false;

    // Rate limiting to prevent spam
    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_COOLDOWN) {
      return false;
    }
    lastMoveTime.current = now;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (!isValidMove(newX, newY)) {
      return false;
    }

    // Check what's at the new position
    const cellType = maze[newY][newX];
    
    // Handle collectibles
    if (cellType === CELL_TYPES.COLLECTIBLE) {
      onCollectItem();
      // The maze should be updated externally to remove the collectible
    }
    
    // Handle exit
    if (cellType === CELL_TYPES.EXIT) {
      onReachExit();
    }

    // Update position
    setPlayerPos({ x: newX, y: newY });
    return true;
  }, [playerPos, gameState, isValidMove, maze, onCollectItem, onReachExit]);

  const setPlayerPosition = useCallback((pos: Position) => {
    if (isValidMove(pos.x, pos.y)) {
      setPlayerPos(pos);
    }
  }, [isValidMove]);

  const resetPosition = useCallback((initialPos: Position) => {
    setPlayerPos(initialPos);
    lastMoveTime.current = 0;
  }, []);

  return {
    playerPos,
    movePlayer,
    setPlayerPosition,
    getValidMoves,
    isValidMove,
    resetPosition
  };
};
