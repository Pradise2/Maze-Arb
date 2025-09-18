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
      
      // Carve path to neighbor
      const wallX = current.x + (next.x - current.x) / 2;
      const wallY = current.y + (next.y - current.y) / 2;
      
      maze[next.y][next.x] = CELL_TYPES.PATH;
      maze[wallY][wallX] = CELL_TYPES.PATH;
      
      stack.push(next);
    } else {
      stack.pop();
    }
  }
  
  // Add exit at bottom-right corner
  maze[h - 2][w - 2] = CELL_TYPES.EXIT;
  
  // Add collectibles randomly
  const pathCells: Position[] = [];
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      if (maze[y][x] === CELL_TYPES.PATH && !(x === 1 && y === 1) && !(x === w - 2 && y === h - 2)) {
        pathCells.push({ x, y });
      }
    }
  }
  
  // Shuffle and place collectibles
  const shuffled = pathCells.sort(() => Math.random() - 0.5);
  const collectibleCount = Math.min(collectibles, shuffled.length);
  
  for (let i = 0; i < collectibleCount; i++) {
    const pos = shuffled[i];
    maze[pos.y][pos.x] = CELL_TYPES.COLLECTIBLE;
  }
  
  return maze;
};

/**
 * Check if maze is solvable from start to exit
 */
export const isMazeSolvable = (maze: number[][], start: Position, exit: Position): boolean => {
  if (!isInBounds(start.x, start.y, maze) || !isInBounds(exit.x, exit.y, maze)) {
    return false;
  }
  
  const visited = new Set<string>();
  const queue: Position[] = [start];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (current.x === exit.x && current.y === exit.y) {
      return true;
    }
    
    // Check all four directions
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nextKey = `${nx},${ny}`;
      
      if (isInBounds(nx, ny, maze) && !visited.has(nextKey) && maze[ny][nx] !== CELL_TYPES.WALL) {
        queue.push({ x: nx, y: ny });
      }
    }
  }
  
  return false;
};

/**
 * Get all reachable positions from a starting point
 */
export const getReachablePositions = (maze: number[][], start: Position): Position[] => {
  const reachable: Position[] = [];
  const visited = new Set<string>();
  const queue: Position[] = [start];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    reachable.push(current);
    
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nextKey = `${nx},${ny}`;
      
      if (isInBounds(nx, ny, maze) && !visited.has(nextKey) && maze[ny][nx] !== CELL_TYPES.WALL) {
        queue.push({ x: nx, y: ny });
      }
    }
  }
  
  return reachable;
};

/**
 * Find dead ends in the maze
 */
export const findDeadEnds = (maze: number[][]): Position[] => {
  const deadEnds: Position[] = [];
  
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] !== CELL_TYPES.WALL) {
        const neighbors = [
          { x: x, y: y - 1 }, { x: x, y: y + 1 },
          { x: x - 1, y: y }, { x: x + 1, y: y }
        ];
        
        const openNeighbors = neighbors.filter(pos => 
          isInBounds(pos.x, pos.y, maze) && maze[pos.y][pos.x] !== CELL_TYPES.WALL
        );
        
        if (openNeighbors.length === 1) {
          deadEnds.push({ x, y });
        }
      }
    }
  }
  
  return deadEnds;
};

/**
 * Remove dead ends from maze (useful for making mazes less linear)
 */
export const removeDeadEnds = (maze: number[][]): number[][] => {
  let modifiedMaze = cloneMaze(maze);
  let changed = true;
  
  while (changed) {
    changed = false;
    const deadEnds = findDeadEnds(modifiedMaze);
    
    for (const deadEnd of deadEnds) {
      // Don't remove if it contains important items
      const cellType = modifiedMaze[deadEnd.y][deadEnd.x];
      if (cellType === CELL_TYPES.EXIT || cellType === CELL_TYPES.COLLECTIBLE) {
        continue;
      }
      
      modifiedMaze[deadEnd.y][deadEnd.x] = CELL_TYPES.WALL;
      changed = true;
    }
  }
  
  return modifiedMaze;
};

/**
 * Add loops to make maze less linear
 */
export const addLoops = (maze: number[][], loopCount: number = 3): number[][] => {
  const modifiedMaze = cloneMaze(maze);
  const { width, height } = getMazeDimensions(maze);
  
  for (let i = 0; i < loopCount; i++) {
    // Find random wall to potentially remove
    let attempts = 0;
    while (attempts < 50) { // Prevent infinite loops
      const x = 1 + Math.floor(Math.random() * (width - 2));
      const y = 1 + Math.floor(Math.random() * (height - 2));
      
      if (modifiedMaze[y][x] === CELL_TYPES.WALL) {
        // Check if removing this wall would connect two different areas
        const neighbors = [
          { x: x, y: y - 1 }, { x: x, y: y + 1 },
          { x: x - 1, y: y }, { x: x + 1, y: y }
        ].filter(pos => 
          isInBounds(pos.x, pos.y, modifiedMaze) && 
          modifiedMaze[pos.y][pos.x] !== CELL_TYPES.WALL
        );
        
        if (neighbors.length >= 2) {
          modifiedMaze[y][x] = CELL_TYPES.PATH;
          break;
        }
      }
      attempts++;
    }
  }
  
  return modifiedMaze;
};

/**
 * Scale maze up or down
 */
export const scaleMaze = (maze: number[][], scale: number): number[][] => {
  if (scale <= 0) return maze;
  
  const { width, height } = getMazeDimensions(maze);
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);
  
  const scaledMaze: number[][] = Array(newHeight).fill(null).map(() => Array(newWidth).fill(CELL_TYPES.WALL));
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const origX = Math.floor(x / scale);
      const origY = Math.floor(y / scale);
      
      if (origX < width && origY < height) {
        scaledMaze[y][x] = maze[origY][origX];
      }
    }
  }
  
  return scaledMaze;
};

/**
 * Mirror maze horizontally
 */
export const mirrorMazeHorizontal = (maze: number[][]): number[][] => {
  return maze.map(row => [...row].reverse());
};

/**
 * Mirror maze vertically
 */
export const mirrorMazeVertical = (maze: number[][]): number[][] => {
  return [...maze].reverse();
};

/**
 * Rotate maze 90 degrees clockwise
 */
export const rotateMazeClockwise = (maze: number[][]): number[][] => {
  const { width, height } = getMazeDimensions(maze);
  const rotated: number[][] = Array(width).fill(null).map(() => Array(height).fill(CELL_TYPES.WALL));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rotated[x][height - 1 - y] = maze[y][x];
    }
  }
  
  return rotated;
};

/**
 * Combine two mazes side by side
 */
export const combineMazesHorizontal = (maze1: number[][], maze2: number[][]): number[][] => {
  const height = Math.max(maze1.length, maze2.length);
  const combined: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row1 = maze1[y] || Array(maze1[0]?.length || 0).fill(CELL_TYPES.WALL);
    const row2 = maze2[y] || Array(maze2[0]?.length || 0).fill(CELL_TYPES.WALL);
    combined.push([...row1, ...row2]);
  }
  
  return combined;
};

/**
 * Get maze statistics
 */
export const getMazeStatistics = (maze: number[][]): {
  dimensions: { width: number; height: number };
  cellCounts: Record<string, number>;
  deadEndCount: number;
  pathLength: number;
  density: number;
} => {
  const dimensions = getMazeDimensions(maze);
  const totalCells = dimensions.width * dimensions.height;
  
  const cellCounts = {
    walls: countCells(maze, CELL_TYPES.WALL),
    paths: countCells(maze, CELL_TYPES.PATH),
    exits: countCells(maze, CELL_TYPES.EXIT),
    collectibles: countCells(maze, CELL_TYPES.COLLECTIBLE),
    enemies: countCells(maze, CELL_TYPES.ENEMY)
  };
  
  const deadEnds = findDeadEnds(maze);
  const pathLength = cellCounts.paths + cellCounts.exits + cellCounts.collectibles;
  const density = cellCounts.walls / totalCells;
  
  return {
    dimensions,
    cellCounts,
    deadEndCount: deadEnds.length,
    pathLength,
    density
  };
};

/**
 * Convert maze to string representation for debugging
 */
export const mazeToString = (maze: number[][], symbols: Record<number, string> = {
  [CELL_TYPES.WALL]: '█',
  [CELL_TYPES.PATH]: ' ',
  [CELL_TYPES.PLAYER]: 'P',
  [CELL_TYPES.EXIT]: 'E',
  [CELL_TYPES.COLLECTIBLE]: '*',
  [CELL_TYPES.ENEMY]: 'X'
}): string => {
  return maze.map(row => 
    row.map(cell => symbols[cell] || '?').join('')
  ).join('\n');
};

/**
 * Parse maze from string representation
 */
export const stringToMaze = (mazeString: string, symbolMap: Record<string, number> = {
  '█': CELL_TYPES.WALL,
  ' ': CELL_TYPES.PATH,
  'P': CELL_TYPES.PLAYER,
  'E': CELL_TYPES.EXIT,
  '*': CELL_TYPES.COLLECTIBLE,
  'X': CELL_TYPES.ENEMY
}): number[][] => {
  return mazeString.trim().split('\n').map(row =>
    row.split('').map(char => symbolMap[char] ?? CELL_TYPES.WALL)
  );
};

/**
 * Export maze as JSON
 */
export const exportMaze = (maze: number[][], metadata: any = {}): string => {
  const mazeData = {
    maze,
    metadata: {
      ...metadata,
      generated: new Date().toISOString(),
      dimensions: getMazeDimensions(maze),
      statistics: getMazeStatistics(maze)
    }
  };
  
  return JSON.stringify(mazeData, null, 2);
};

/**
 * Import maze from JSON
 */
export const importMaze = (jsonString: string): { maze: number[][]; metadata: any } | null => {
  try {
    const data = JSON.parse(jsonString);
    if (data.maze && Array.isArray(data.maze)) {
      return {
        maze: data.maze,
        metadata: data.metadata || {}
      };
    }
  } catch (error) {
    console.error('Failed to import maze:', error);
  }
  
  return null;
};
