// src/utilities/collision.ts - Collision Detection Utilities
import { type Position, CELL_TYPES, type CollisionResult } from '../types/game.types';

/**
 * Check if a position is within maze bounds
 */
export const isInBounds = (x: number, y: number, maze: number[][]): boolean => {
  return y >= 0 && y < maze.length && x >= 0 && x < maze[0].length;
};

/**
 * Check if a position is a valid move (not a wall)
 */
export const isValidPosition = (x: number, y: number, maze: number[][]): boolean => {
  if (!isInBounds(x, y, maze)) return false;
  return maze[y][x] !== CELL_TYPES.WALL;
};

/**
 * Check collision between player and enemies
 */
export const checkEnemyCollision = (playerPos: Position, enemies: Position[]): boolean => {
  return enemies.some(enemy => 
    enemy.x === playerPos.x && enemy.y === playerPos.y
  );
};

/**
 * Check if position contains a collectible
 */
export const isCollectible = (x: number, y: number, maze: number[][]): boolean => {
  if (!isInBounds(x, y, maze)) return false;
  return maze[y][x] === CELL_TYPES.COLLECTIBLE;
};

/**
 * Check if position is an exit
 */
export const isExit = (x: number, y: number, maze: number[][]): boolean => {
  if (!isInBounds(x, y, maze)) return false;
  return maze[y][x] === CELL_TYPES.EXIT;
};

/**
 * Get cell type at position
 */
export const getCellType = (x: number, y: number, maze: number[][]): number => {
  if (!isInBounds(x, y, maze)) return CELL_TYPES.WALL;
  return maze[y][x];
};

/**
 * Comprehensive collision detection
 */
export const checkCollision = (
  x: number, 
  y: number, 
  maze: number[][],
  enemies: Position[] = []
): CollisionResult => {
  // Check bounds
  if (!isInBounds(x, y, maze)) {
    return { collision: true, type: 'boundary', position: { x, y } };
  }

  // Check wall collision
  if (maze[y][x] === CELL_TYPES.WALL) {
    return { collision: true, type: 'wall', position: { x, y } };
  }

  // Check enemy collision
  if (checkEnemyCollision({ x, y }, enemies)) {
    return { collision: true, type: 'enemy', position: { x, y } };
  }

  // Check collectible
  if (maze[y][x] === CELL_TYPES.COLLECTIBLE) {
    return { collision: true, type: 'collectible', position: { x, y } };
  }

  // Check exit
  if (maze[y][x] === CELL_TYPES.EXIT) {
    return { collision: true, type: 'exit', position: { x, y } };
  }

  return { collision: false, type: 'wall' };
};

/**
 * Get valid adjacent positions
 */
export const getAdjacentPositions = (pos: Position, maze: number[][]): Position[] => {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }   // right
  ];

  return directions
    .map(dir => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
    .filter(newPos => isValidPosition(newPos.x, newPos.y, maze));
};

/**
 * Calculate Manhattan distance between two positions
 */
export const getDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

/**
 * Calculate Euclidean distance between two positions
 */
export const getEuclideanDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find the closest position to a target from a list of positions
 */
export const findClosestPosition = (target: Position, positions: Position[]): Position | null => {
  if (positions.length === 0) return null;

  return positions.reduce((closest, current) => {
    const currentDistance = getDistance(target, current);
    const closestDistance = getDistance(target, closest);
    return currentDistance < closestDistance ? current : closest;
  });
};

/**
 * Check if two positions are adjacent (including diagonals)
 */
export const areAdjacent = (pos1: Position, pos2: Position): boolean => {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return dx <= 1 && dy <= 1 && (dx + dy > 0);
};

/**
 * Check if two positions are adjacent (only horizontal/vertical)
 */
export const areOrthogonallyAdjacent = (pos1: Position, pos2: Position): boolean => {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

/**
 * Get all positions of a specific cell type
 */
export const findCellPositions = (maze: number[][], cellType: number): Position[] => {
  const positions: Position[] = [];
  
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === cellType) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
};

/**
 * Simple pathfinding using BFS
 */
export const findPath = (
  start: Position, 
  goal: Position, 
  maze: number[][]
): Position[] | null => {
  if (!isValidPosition(start.x, start.y, maze) || 
      !isValidPosition(goal.x, goal.y, maze)) {
    return null;
  }

  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    const key = `${pos.x},${pos.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (pos.x === goal.x && pos.y === goal.y) {
      return path;
    }
    
    const adjacent = getAdjacentPositions(pos, maze);
    for (const nextPos of adjacent) {
      const nextKey = `${nextPos.x},${nextPos.y}`;
      if (!visited.has(nextKey)) {
        queue.push({ 
          pos: nextPos, 
          path: [...path, nextPos] 
        });
      }
    }
  }
  
  return null; // No path found
};

/**
 * Check if there's a clear line of sight between two positions
 */
export const hasLineOfSight = (
  pos1: Position, 
  pos2: Position, 
  maze: number[][]
): boolean => {
  const dx = Math.abs(pos2.x - pos1.x);
  const dy = Math.abs(pos2.y - pos1.y);
  
  const stepX = pos1.x < pos2.x ? 1 : -1;
  const stepY = pos1.y < pos2.y ? 1 : -1;
  
  let x = pos1.x;
  let y = pos1.y;
  let error = dx - dy;
  
  while (x !== pos2.x || y !== pos2.y) {
    if (!isValidPosition(x, y, maze)) {
      return false;
    }
    
    const error2 = 2 * error;
    
    if (error2 > -dy) {
      error -= dy;
      x += stepX;
    }
    
    if (error2 < dx) {
      error += dx;
      y += stepY;
    }
  }
  
  return true;
};

/**
 * Generate safe positions (not near walls or enemies)
 */
export const findSafePositions = (
  maze: number[][], 
  enemies: Position[], 
  minDistanceFromEnemies: number = 3
): Position[] => {
  const safePositions: Position[] = [];
  
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (isValidPosition(x, y, maze)) {
        const pos = { x, y };
        const isSafe = enemies.every(enemy => 
          getDistance(pos, enemy) >= minDistanceFromEnemies
        );
        
        if (isSafe) {
          safePositions.push(pos);
        }
      }
    }
  }
  
  return safePositions;
};
