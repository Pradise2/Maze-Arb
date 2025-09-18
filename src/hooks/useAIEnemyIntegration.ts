// hooks/useEnhancedEnemyAI.ts - Advanced AI Enemy Behavior
import { useState, useCallback, useEffect, useRef } from 'react';
import { Position } from '../types/game.types';

interface EnemyPersonality {
  type: 'hunter' | 'guardian' | 'scout' | 'ambusher' | 'swarm';
  aggressiveness: number; // 0-1
  intelligence: number;   // 0-1
  patience: number;       // 0-1
  cooperation: number;    // 0-1
}

interface SmartEnemy {
  id: string;
  position: Position;
  personality: EnemyPersonality;
  state: 'patrolling' | 'chasing' | 'searching' | 'ambushing' | 'coordinating';
  energy: number; // 0-100
  lastPlayerSight: Position | null;
  patrolRoute: Position[];
  currentTarget: Position | null;
  frustrationLevel: number;
  cooperationGroup?: string;
}

interface PlayerPattern {
  favoriteDirections: Record<string, number>;
  commonSequences: Map<string, number>;
  retreatBehavior: 'corner' | 'backtrack' | 'random' | 'predictable';
  averageSpeed: number;
  decisionTime: number;
}

interface GameContext {
  maze: number[][];
  playerPos: Position;
  playerHistory: Position[];
  gameTime: number;
  difficulty: 'easy' | 'normal' | 'hard';
  levelLayout: 'linear' | 'branching' | 'circular' | 'complex';
}

export const useEnhancedEnemyAI = (
  maze: number[][],
  playerPos: Position,
  gameState: string,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  aiEnabled: boolean = false,
  aiApiKey?: string
) => {
  const [enemies, setEnemies] = useState<SmartEnemy[]>([]);
  const [playerHistory, setPlayerHistory] = useState<Position[]>([]);
  const [playerPattern, setPlayerPattern] = useState<PlayerPattern | null>(null);
  const [gameContext, setGameContext] = useState<GameContext | null>(null);
  
  const patternAnalysisRef = useRef<Map<string, number>>(new Map());
  const lastAnalysisRef = useRef<number>(0);
  const cooperationGroupsRef = useRef<Map<string, SmartEnemy[]>>(new Map());

  // Initialize enemy personalities based on difficulty
  const createEnemyPersonality = useCallback((index: number, total: number): EnemyPersonality => {
    const personalityTypes: EnemyPersonality['type'][] = ['hunter', 'guardian', 'scout', 'ambusher', 'swarm'];
    
    const difficultyModifiers = {
      easy: { intelligence: 0.3, aggressiveness: 0.4, patience: 0.6 },
      normal: { intelligence: 0.6, aggressiveness: 0.6, patience: 0.5 },
      hard: { intelligence: 0.9, aggressiveness: 0.8, patience: 0.3 }
    };

    const baseType = personalityTypes[index % personalityTypes.length];
    const mods = difficultyModifiers[difficulty];

    const personalities = {
      hunter: {
        aggressiveness: 0.9 * mods.aggressiveness,
        intelligence: 0.6 * mods.intelligence,
        patience: 0.2 * mods.patience,
        cooperation: 0.3
      },
      guardian: {
        aggressiveness: 0.4 * mods.aggressiveness,
        intelligence: 0.8 * mods.intelligence,
        patience: 0.9 * mods.patience,
        cooperation: 0.7
      },
      scout: {
        aggressiveness: 0.5 * mods.aggressiveness,
        intelligence: 0.9 * mods.intelligence,
        patience: 0.6 * mods.patience,
        cooperation: 0.8
      },
      ambusher: {
        aggressiveness: 0.7 * mods.aggressiveness,
        intelligence: 0.7 * mods.intelligence,
        patience: 0.9 * mods.patience,
        cooperation: 0.4
      },
      swarm: {
        aggressiveness: 0.6 * mods.aggressiveness,
        intelligence: 0.5 * mods.intelligence,
        patience: 0.4 * mods.patience,
        cooperation: 0.9
      }
    };

    return {
      type: baseType,
      ...personalities[baseType]
    };
  }, [difficulty]);

  // Analyze player movement patterns
  const analyzePlayerPattern = useCallback((history: Position[]): PlayerPattern => {
    if (history.length < 10) {
      return {
        favoriteDirections: {},
        commonSequences: new Map(),
        retreatBehavior: 'random',
        averageSpeed: 1,
        decisionTime: 1
      };
    }

    const directions = { up: 0, down: 0, left: 0, right: 0 };
    const sequences = new Map<string, number>();
    
    // Analyze direction preferences
    for (let i = 1; i < history.length; i++) {
      const dx = history[i].x - history[i-1].x;
      const dy = history[i].y - history[i-1].y;
      
      if (dx === 0 && dy === -1) directions.up++;
      else if (dx === 0 && dy === 1) directions.down++;
      else if (dx === -1 && dy === 0) directions.left++;
      else if (dx === 1 && dy === 0) directions.right++;
    }

    // Analyze 3-move sequences
    for (let i = 2; i < Math.min(history.length, 50); i++) {
      const seq = `${history[i-2].x},${history[i-2].y}-${history[i-1].x},${history[i-1].y}-${history[i].x},${history[i].y}`;
      sequences.set(seq, (sequences.get(seq) || 0) + 1);
    }

    // Detect retreat behavior
    let retreatBehavior: PlayerPattern['retreatBehavior'] = 'random';
    const recentMoves = history.slice(-10);
    const backtrackCount = recentMoves.filter((pos, i) => 
      i > 1 && pos.x === recentMoves[i-2].x && pos.y === recentMoves[i-2].y
    ).length;
    
    if (backtrackCount > 2) retreatBehavior = 'backtrack';
    else if (recentMoves.some(pos => pos.x <= 2 || pos.y <= 2)) retreatBehavior = 'corner';

    return {
      favoriteDirections: directions,
      commonSequences: sequences,
      retreatBehavior,
      averageSpeed: history.length > 1 ? (history.length - 1) / 10 : 1,
      decisionTime: 1
    };
  }, []);

  // Predict player next move based on patterns
  const predictPlayerMove = useCallback((currentPos: Position, pattern: PlayerPattern): Position[] => {
    const possibleMoves: Array<{pos: Position, probability: number}> = [];
    const directions = [
      { x: 0, y: -1, name: 'up' },
      { x: 0, y: 1, name: 'down' },
      { x: -1, y: 0, name: 'left' },
      { x: 1, y: 0, name: 'right' }
    ];

    directions.forEach(dir => {
      const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
      
      // Check if move is valid
      if (isValidMove(newPos.x, newPos.y)) {
        const baseProbability = 0.25;
        const directionBonus = (pattern.favoriteDirections[dir.name] || 0) / 100;
        const probability = Math.min(baseProbability + directionBonus, 0.8);
        
        possibleMoves.push({ pos: newPos, probability });
      }
    });

    return possibleMoves
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2)
      .map(move => move.pos);
  }, []);

  // Check if position is valid for movement
  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (!maze || maze.length === 0) return false;
    return (
      y >= 0 && 
      y < maze.length && 
      x >= 0 && 
      x < maze[0].length &&
      maze[y][x] !== 1 // Not a wall
    );
  }, [maze]);

  // Calculate strategic position value for enemies
  const calculatePositionValue = useCallback((pos: Position, enemy: SmartEnemy): number => {
    let value = 0;
    const distanceToPlayer = Math.abs(pos.x - playerPos.x) + Math.abs(pos.y - playerPos.y);
    
    switch (enemy.personality.type) {
      case 'hunter':
        value = Math.max(0, 10 - distanceToPlayer); // Closer is better
        break;
      case 'guardian':
        // Value positions that control key chokepoints
        value = 5 - Math.abs(distanceToPlayer - 4); // Optimal distance of 4
        break;
      case 'scout':
        // Value positions with good visibility/coverage
        value = getVisibilityScore(pos);
        break;
      case 'ambusher':
        // Value positions near predicted player paths
        if (playerPattern) {
          const predictedMoves = predictPlayerMove(playerPos, playerPattern);
          value = predictedMoves.reduce((sum, predicted) => {
            const distToPredicted = Math.abs(pos.x - predicted.x) + Math.abs(pos.y - predicted.y);
            return sum + Math.max(0, 3 - distToPredicted);
          }, 0);
        }
        break;
      case 'swarm':
        // Value positions that coordinate with other swarm enemies
        const swarmGroup = cooperationGroupsRef.current.get(enemy.cooperationGroup || '');
        if (swarmGroup) {
          value = swarmGroup.reduce((sum, otherEnemy) => {
            if (otherEnemy.id !== enemy.id) {
              const distToOther = Math.abs(pos.x - otherEnemy.position.x) + Math.abs(pos.y - otherEnemy.position.y);
              return sum + Math.max(0, 5 - distToOther); // Stay reasonably close
            }
            return sum;
          }, 0);
        }
        break;
    }

    return value;
  }, [playerPos, playerPattern, predictPlayerMove]);

  // Calculate visibility/coverage score for scouts
  const getVisibilityScore = useCallback((pos: Position): number => {
    let score = 0;
    const maxDistance = 5;
    
    for (let dx = -maxDistance; dx <= maxDistance; dx++) {
      for (let dy = -maxDistance; dy <= maxDistance; dy++) {
        const checkX = pos.x + dx;
        const checkY = pos.y + dy;
        
        if (isValidMove(checkX, checkY)) {
          const distance = Math.abs(dx) + Math.abs(dy);
          score += Math.max(0, maxDistance - distance);
        }
      }
    }
    
    return score;
  }, [isValidMove]);

  // Smart pathfinding that considers enemy personality
  const findSmartPath = useCallback((enemy: SmartEnemy, target: Position): Position | null => {
    const start = enemy.position;
    const queue: Array<{pos: Position, path: Position[], cost: number}> = [{
      pos: start,
      path: [start],
      cost: 0
    }];
    const visited = new Set<string>();
    const maxDepth = enemy.personality.intelligence * 15;

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;
      const key = `${current.pos.x},${current.pos.y}`;

      if (visited.has(key) || current.path.length > maxDepth) continue;
      visited.add(key);

      if (current.pos.x === target.x && current.pos.y === target.y) {
        return current.path.length > 1 ? current.path[1] : current.pos;
      }

      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];

      for (const dir of directions) {
        const newPos = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };
        const newKey = `${newPos.x},${newPos.y}`;
        
        if (isValidMove(newPos.x, newPos.y) && !visited.has(newKey)) {
          const moveCost = 1;
          const strategicValue = calculatePositionValue(newPos, enemy) * 0.1;
          const totalCost = current.cost + moveCost - strategicValue;
          
          queue.push({
            pos: newPos,
            path: [...current.path, newPos],
            cost: totalCost
          });
        }
      }
    }

    return null;
  }, [isValidMove, calculatePositionValue]);

  // Update enemy behavior based on personality and game state
  const updateEnemyBehavior = useCallback((enemy: SmartEnemy): SmartEnemy => {
    const distanceToPlayer = Math.abs(enemy.position.x - playerPos.x) + Math.abs(enemy.position.y - playerPos.y);
    const canSeePlayer = distanceToPlayer <= 5; // Simplified line of sight
    
    let newState = enemy.state;
    let newTarget = enemy.currentTarget;
    let newEnergy = Math.max(0, enemy.energy - 1); // Energy decreases over time
    let newFrustration = enemy.frustrationLevel;

    // State transitions based on personality and situation
    switch (enemy.state) {
      case 'patrolling':
        if (canSeePlayer && Math.random() < enemy.personality.aggressiveness) {
          newState = 'chasing';
          newTarget = playerPos;
          newEnergy = Math.min(100, newEnergy + 20); // Boost energy when spotting player
        }
        break;

      case 'chasing':
        if (!canSeePlayer) {
          if (enemy.personality.intelligence > 0.7) {
            newState = 'searching';
            newTarget = enemy.lastPlayerSight;
          } else {
            newState = 'patrolling';
            newTarget = null;
          }
        } else {
          newTarget = playerPos;
          newFrustration = distanceToPlayer > 3 ? newFrustration + 1 : 0;
        }
        break;

      case 'searching':
        if (canSeePlayer) {
          newState = 'chasing';
          newTarget = playerPos;
          newFrustration = 0;
        } else if (newFrustration > enemy.personality.patience * 10) {
          newState = 'patrolling';
          newFrustration = 0;
        }
        newFrustration += 1;
        break;

      case 'ambushing':
        if (canSeePlayer && distanceToPlayer <= 2) {
          newState = 'chasing';
          newTarget = playerPos;
        } else if (newEnergy < 20) {
          newState = 'patrolling';
        }
        break;
    }

    // Special behavior for ambushers
    if (enemy.personality.type === 'ambusher' && playerPattern && newState === 'patrolling') {
      const predictedMoves = predictPlayerMove(playerPos, playerPattern);
      if (predictedMoves.length > 0 && Math.random() < 0.3) {
        newState = 'ambushing';
        newTarget = predictedMoves[0];
      }
    }

    return {
      ...enemy,
      state: newState,
      currentTarget: newTarget,
      energy: newEnergy,
      frustrationLevel: newFrustration,
      lastPlayerSight: canSeePlayer ? playerPos : enemy.lastPlayerSight
    };
  }, [playerPos, playerPattern, predictPlayerMove]);

  // Main enemy update function
  const updateEnemies = useCallback(() => {
    if (gameState !== 'playing' || enemies.length === 0) return;

    setEnemies(prevEnemies => 
      prevEnemies.map(enemy => {
        // Update enemy behavior/state
        const updatedEnemy = updateEnemyBehavior(enemy);
        
        // Calculate next position
        let nextPos = enemy.position;
        
        if (updatedEnemy.currentTarget) {
          const smartMove = findSmartPath(updatedEnemy, updatedEnemy.currentTarget);
          if (smartMove) {
            nextPos = smartMove;
          }
        }

        // Apply movement based on personality
        const shouldMove = Math.random() < (updatedEnemy.personality.aggressiveness * 0.8 + 0.2);
        
        return {
          ...updatedEnemy,
          position: shouldMove ? nextPos : enemy.position
        };
      })
    );
  }, [gameState, enemies, updateEnemyBehavior, findSmartPath]);

  // Initialize enemies with personalities
  const initializeEnemies = useCallback((positions: Position[]) => {
    const newEnemies: SmartEnemy[] = positions.map((pos, index) => ({
      id: `enemy-${index}`,
      position: pos,
      personality: createEnemyPersonality(index, positions.length),
      state: 'patrolling',
      energy: 100,
      lastPlayerSight: null,
      patrolRoute: [],
      currentTarget: null,
      frustrationLevel: 0,
      cooperationGroup: Math.floor(index / 2).toString() // Group enemies in pairs
    }));

    // Set up cooperation groups
    cooperationGroupsRef.current.clear();
    newEnemies.forEach(enemy => {
      if (enemy.cooperationGroup) {
        const group = cooperationGroupsRef.current.get(enemy.cooperationGroup) || [];
        group.push(enemy);
        cooperationGroupsRef.current.set(enemy.cooperationGroup, group);
      }
    });

    setEnemies(newEnemies);
  }, [createEnemyPersonality]);

  // Update player history and analyze patterns
  useEffect(() => {
    setPlayerHistory(prev => {
      const updated = [...prev.slice(-30), playerPos]; // Keep last 30 positions
      
      // Analyze patterns every 10 moves
      if (updated.length % 10 === 0 && Date.now() - lastAnalysisRef.current > 5000) {
        const newPattern = analyzePlayerPattern(updated);
        setPlayerPattern(newPattern);
        lastAnalysisRef.current = Date.now();
      }
      
      return updated;
    });
  }, [playerPos, analyzePlayerPattern]);

  // Check if player is caught
  const isPlayerCaught = useCallback((playerPosition: Position): boolean => {
    return enemies.some(enemy => 
      enemy.position.x === playerPosition.x && enemy.position.y === playerPosition.y
    );
  }, [enemies]);

  // Get AI insights for debugging
  const getAIInsights = useCallback(() => {
    if (!playerPattern) return [];
    
    const insights = [];
    
    // Player pattern insights
    const topDirection = Object.entries(playerPattern.favoriteDirections)
      .sort(([,a], [,b]) => b - a)[0];
    if (topDirection) {
      insights.push(`Player prefers moving ${topDirection[0]} (${topDirection[1]} times)`);
    }
    
    insights.push(`Retreat behavior: ${playerPattern.retreatBehavior}`);
    
    // Enemy state summary
    const stateCount = enemies.reduce((acc, enemy) => {
      acc[enemy.state] = (acc[enemy.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    insights.push(`Enemy states: ${Object.entries(stateCount).map(([state, count]) => `${count} ${state}`).join(', ')}`);
    
    return insights;
  }, [playerPattern, enemies]);

  return {
    enemies: enemies.map(e => ({ x: e.position.x, y: e.position.y, id: e.id })), // Convert to simple format for compatibility
    smartEnemies: enemies,
    updateEnemies,
    initializeEnemies,
    isPlayerCaught,
    playerPattern,
    aiInsights: getAIInsights(),
    setEnemies: (positions: Position[]) => initializeEnemies(positions),
    resetEnemies: initializeEnemies
  };
};
