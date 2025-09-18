
// src/utilities/mazeUtilities.ts - Maze Utility Functions
import { Position, CELL_TYPES } from '../types/game.types';
import { isInBounds, findCellPositions } from './collision';

/**
 * Create a deep copy of a maze
 */
export const cloneMaze = (maze: number[][]): number[][] => {
  return maze.map(row => [...row]);
};

/**
 * Count cells of a specific type
 */
export const countCells = (maze: number[][], cellType: number): number => {
  return maze.flat().filter(cell => cell === cellType).length;
};

/**
 * Update a cell in the maze
 */
export const updateMazeCell = (
  maze: number[][], 
  x: number, 
  y: number, 
  newValue: number
): number[][] => {
  if (!isInBounds(x, y, maze)) return maze;
  
  const newMaze = cloneMaze(maze);
  newMaze[y][x] = newValue;
  return newMaze;
};

/**
 * Remove a collectible from the maze
 */
export const removeCollectible = (maze: number[][], x: number, y: number): number[][] => {
  return updateMazeCell(maze, x, y, CELL_TYPES.PATH);
};

/**
 * Get maze dimensions
 */
export const getMazeDimensions = (maze: number[][]): { width: number; height: number } => {
  return {
    width: maze[0]?.length || 0,
    height: maze.length
  };
};

/**
 * Validate maze structure
 */
export const validateMaze = (maze: number[][]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!maze || maze.length === 0) {
    errors.push('Maze is empty');
    return { isValid: false, errors };
  }
  
  if (maze[0].length === 0) {
    errors.push('Maze has no columns');
    return { isValid: false, errors };
  }
  
  // Check if all rows have the same length
  const expectedWidth = maze[0].length;
  const inconsistentRows = maze.findIndex(row => row.length !== expectedWidth);
  if (inconsistentRows !== -1) {
    errors.push(`Row ${inconsistentRows} has inconsistent width`);
  }
  
  // Check for required elements
  const exits = countCells(maze, CELL_TYPES.EXIT);
  const collectibles = countCells(maze, CELL_TYPES.COLLECTIBLE);
  
  if (exits === 0) {
    errors.push('Maze must have at least one exit');
  }
  
  if (collectibles === 0) {
    errors.push('Maze should have at least one collectible');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Find starting position (first path cell or designated start)
 */
export const findStartPosition = (maze: number[][]): Position | null => {
  // Look for designated start position first
  const startPositions = findCellPositions(maze, CELL_TYPES.PLAYER);
  if (startPositions.length > 0) {
    return startPositions[0];
  }
  
  // Otherwise find first available path
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === CELL_TYPES.PATH) {
        return { x, y };
      }
    }
  }
  
  return null;
};

/**
 * Find all exit positions
 */
export const findExitPositions = (maze: number[][]): Position[] => {
  return findCellPositions(maze, CELL_TYPES.EXIT);
};

/**
 * Find all collectible positions
 */
export const findCollectiblePositions = (maze: number[][]): Position[] => {
  return findCellPositions(maze, CELL_TYPES.COLLECTIBLE);
};

/**
 * Generate random maze using recursive backtracking
 */
export const generateMaze = (
  width: number, 
  height: number, 
  collectibles: number = 3
): number[][] => {
  // Ensure odd dimensions for proper maze generation
  const w = width % 2 === 0 ? width + 1 : width;
  const h = height % 2 === 0 ? height + 1 : height;
  
  // Initialize maze filled with walls
  const maze: number[][] = Array(h).fill(null).map(() => Array(w).fill(CELL_TYPES.WALL));
  
  const stack: Position[] = [];
  const start = { x: 1, y: 1 };
  maze[start.y][start.x] = CELL_TYPES.PATH;
  stack.push(start);
  
  const directions = [
    { x: 0, y: -2 }, // up
    { x: 2, y: 0 },  // right
    { x: 0, y: 2 },  // down
    { x: -2, y: 0 }  // left
  ];
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Position[] = [];
    
    // Find unvisited neighbors
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      
      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
        if (maze[ny][nx] === CELL_TYPES.WALL) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    
    if (neighbors.length > 0) {
      // Choose random neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
