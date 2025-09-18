// hooks/useEnemyAI.ts - Enemy AI Behavior Hook
import { useState, useCallback, useEffect, useRef } from 'react';
import { Position, GameState, CELL_TYPES } from '../types/game.types';

interface EnemyAI {
  enemies: Position[];
  updateEnemies: () => void;
  setEnemies: (enemies: Position[]) => void;
  resetEnemies: (initialEnemies: Position[]) => void;
  isPlayerCaught: (playerPos: Position) => boolean;
  enemyMoveInterval: number;
}

export const useEnemyAI = (
  maze: number[][],
  playerPos: Position,
  gameState: GameState,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): EnemyAI => {
  const [enemies, setEnemies] = useState<Position[]>([]);
  const moveHistoryRef = useRef<Map<string, Position[]>>(new Map());
  
  const enemyMoveInterval = difficulty === 'easy' ? 1200 : difficulty === 'normal' ? 800 : 500;
  const chaseChance = difficulty === 'easy' ? 0.2 : difficulty === 'normal' ? 0.3 : 0.4;

  const isValidEnemyMove = useCallback((x: number, y: number): boolean => {
    if (!maze || maze.length === 0) return false;
    return (
      y >= 0 && 
      y < maze.length && 
      x >= 0 && 
      x < maze[0].length &&
      maze[y][x] !== CELL_TYPES.WALL
    );
  }, [maze]);

  const getDistance = useCallback((pos1: Position, pos2: Position): number => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }, []);

  const findPathToPlayer = useCallback((enemyPos: Position): Position | null => {
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];

    let bestMove: Position | null = null;
    let shortestDistance = Infinity;

    directions.forEach(dir => {
      const newPos = { x: enemyPos.x + dir.x, y: enemyPos.y + dir.y };
      
      if (isValidEnemyMove(newPos.x, newPos.y)) {
        const distance = getDistance(newPos, playerPos);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestMove = newPos;
        }
      }
    });

    return bestMove;
  }, [playerPos, isValidEnemyMove, getDistance]);

  const getRandomMove = useCallback((enemyPos: Position): Position | null => {
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];

    const validMoves: Position[] = [];
    const enemyKey = `${enemyPos.x},${enemyPos.y}`;
    const history = moveHistoryRef.current.get(enemyKey) || [];

    directions.forEach(dir => {
      const newPos = { x: enemyPos.x + dir.x, y: enemyPos.y + dir.y };
      
      if (isValidEnemyMove(newPos.x, newPos.y)) {
        // Avoid recent positions to prevent getting stuck
        const wasRecentlyHere = history.some(histPos => 
          histPos.x === newPos.x && histPos.y === newPos.y
        );
        
        if (!wasRecentlyHere || validMoves.length === 0) {
          validMoves.push(newPos);
        }
      }
    });

    if (validMoves.length === 0) return null;
    
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }, [isValidEnemyMove]);

  const updateEnemyHistory = useCallback((enemyPos: Position, newPos: Position) => {
    const enemyKey = `${enemyPos.x},${enemyPos.y}`;
    const history = moveHistoryRef.current.get(enemyKey) || [];
    
    history.push(enemyPos);
    if (history.length > 3) history.shift(); // Keep last 3 positions
    
    moveHistoryRef.current.set(`${newPos.x},${newPos.y}`, history);
    moveHistoryRef.current.delete(enemyKey);
  }, []);

  const updateEnemies = useCallback(() => {
    if (gameState !== 'playing' || enemies.length === 0) return;

    setEnemies(prevEnemies => 
      prevEnemies.map(enemy => {
        const shouldChasePlayer = Math.random() < chaseChance;
        let newPos: Position | null = null;

        if (shouldChasePlayer) {
          // Try to move towards player
          newPos = findPathToPlayer(enemy);
        }
        
        // If not chasing or no valid chase move, move randomly
        if (!newPos) {
          newPos = getRandomMove(enemy);
        }

        if (newPos) {
          updateEnemyHistory(enemy, newPos);
          return newPos;
        }

        return enemy;
      })
    );
  }, [gameState, enemies.length, chaseChance, findPathToPlayer, getRandomMove, updateEnemyHistory]);

  const isPlayerCaught = useCallback((playerPosition: Position): boolean => {
    return enemies.some(enemy => 
      enemy.x === playerPosition.x && enemy.y === playerPosition.y
    );
  }, [enemies]);

  const resetEnemies = useCallback((initialEnemies: Position[]) => {
    setEnemies(initialEnemies);
    moveHistoryRef.current.clear();
  }, []);

  // Advanced AI behaviors
  const shouldPatrol = useCallback((enemyPos: Position): boolean => {
    // Enemies patrol when player is far away
    const distanceToPlayer = getDistance(enemyPos, playerPos);
    return distanceToPlayer > 5; // Patrol when player is more than 5 cells away
  }, [getDistance, playerPos]);

  const findPatrolMove = useCallback((enemyPos: Position): Position | null => {
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    // Prefer moves that explore new areas or continue in same direction
    const validMoves = directions
      .map(dir => ({ x: enemyPos.x + dir.x, y: enemyPos.y + dir.y }))
      .filter(pos => isValidEnemyMove(pos.x, pos.y));
    
    if (validMoves.length === 0) return null;
    
    // Simple patrol logic - try to move in straight lines when possible
    const enemyKey = `${enemyPos.x},${enemyPos.y}`;
    const history = moveHistoryRef.current.get(enemyKey) || [];
    
    if (history.length > 0) {
      const lastPos = history[history.length - 1];
      const lastDirection = {
        x: enemyPos.x - lastPos.x,
        y: enemyPos.y - lastPos.y
      };
      
      // Try to continue in same direction
      const continueStraight = {
        x: enemyPos.x + lastDirection.x,
        y: enemyPos.y + lastDirection.y
      };
      
      if (isValidEnemyMove(continueStraight.x, continueStraight.y)) {
        return continueStraight;
      }
    }
    
    // Otherwise pick random valid move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }, [isValidEnemyMove]);

  const getSmartMove = useCallback((enemyPos: Position): Position | null => {
    const distanceToPlayer = getDistance(enemyPos, playerPos);
    
    // Different behaviors based on distance and difficulty
    if (distanceToPlayer <= 2 && difficulty === 'hard') {
      // Close range - always chase on hard difficulty
      return findPathToPlayer(enemyPos);
    } else if (distanceToPlayer <= 4 && Math.random() < chaseChance) {
      // Medium range - chance to chase
      return findPathToPlayer(enemyPos);
    } else if (shouldPatrol(enemyPos)) {
      // Far away - patrol behavior
      return findPatrolMove(enemyPos);
    } else {
      // Default random movement
      return getRandomMove(enemyPos);
    }
  }, [difficulty, getDistance, playerPos, chaseChance, findPathToPlayer, shouldPatrol, findPatrolMove, getRandomMove]);

  // Enhanced update function with smarter AI
  const updateEnemiesSmarter = useCallback(() => {
    if (gameState !== 'playing' || enemies.length === 0) return;

    setEnemies(prevEnemies => 
      prevEnemies.map(enemy => {
        const newPos = getSmartMove(enemy);
        
        if (newPos) {
          updateEnemyHistory(enemy, newPos);
          return newPos;
        }

        return enemy;
      })
    );
  }, [gameState, enemies.length, getSmartMove, updateEnemyHistory]);

  // Use smarter AI for normal and hard difficulties
  const finalUpdateEnemies = difficulty === 'easy' ? updateEnemies : updateEnemiesSmarter;

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enemies.length > 0) {
      console.log('Enemy AI State:', {
        enemyCount: enemies.length,
        difficulty,
        chaseChance,
        moveInterval: enemyMoveInterval,
        gameState
      });
    }
  }, [enemies.length, difficulty, chaseChance, enemyMoveInterval, gameState]);

  return {
    enemies,
    updateEnemies: finalUpdateEnemies,
    setEnemies,
    resetEnemies,
    isPlayerCaught,
    enemyMoveInterval
  };
};
