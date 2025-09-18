
// hooks/useEnemyAI.ts - Enemy AI Behavior Hook
import { useState, useCallback, useEffect, useRef } from 'react';

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

  return {
    enemies,
    updateEnemies,
    setEnemies,
    resetEnemies,
    isPlayerCaught,
    enemyMoveInterval
  };
};
