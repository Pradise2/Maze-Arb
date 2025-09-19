// components/AIEnemyDemo.tsx - Standalone AI Demo (Corrected)
import React, { useState, useEffect } from 'react';
import { Brain, Play, Pause, RotateCcw } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface DemoEnemy {
  id: string;
  position: Position;
  type: 'hunter' | 'scout' | 'guardian' | 'ambusher';
  state: 'patrolling' | 'chasing' | 'searching';
  intelligence: number;
  energy: number;
}

const AIEnemyDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 2, y: 2 });
  const [enemies, setEnemies] = useState<DemoEnemy[]>([
    {
      id: 'hunter',
      position: { x: 6, y: 6 },
      type: 'hunter',
      state: 'patrolling',
      intelligence: 70,
      energy: 100
    },
    {
      id: 'scout',
      position: { x: 8, y: 2 },
      type: 'scout',
      state: 'patrolling',
      intelligence: 85,
      energy: 90
    }
  ]);

  // Simple 10x10 maze for demo
  const maze = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1]
  ];

  const isValidMove = (x: number, y: number) => {
    return x >= 0 && x < 10 && y >= 0 && y < 10 && maze[y][x] === 0;
  };

  const getDistance = (pos1: Position, pos2: Position) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  };

  const findPath = (start: Position, target: Position) => {
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    let bestMove = start;
    let shortestDistance = Infinity;

    for (const dir of directions) {
      const newPos = { x: start.x + dir.x, y: start.y + dir.y };
      
      if (isValidMove(newPos.x, newPos.y)) {
        const distance = getDistance(newPos, target);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestMove = newPos;
        }
      }
    }

    return bestMove;
  };

  // --- Start of Corrected Section ---

  const updateEnemyAI = (enemy: DemoEnemy): DemoEnemy => {
    const distanceToPlayer = getDistance(enemy.position, playerPos);
    let newState = enemy.state;
    let newPosition = enemy.position;

    // State transition logic
    if (distanceToPlayer < 5) {
      newState = 'chasing';
    } else {
      newState = 'patrolling';
    }

    // Movement logic
    if (newState === 'chasing') {
      newPosition = findPath(enemy.position, playerPos);
    } else {
      // Simple random walk for patrol
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ].filter(dir => isValidMove(enemy.position.x + dir.x, enemy.position.y + dir.y));
      
      if (directions.length > 0) {
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        newPosition = { x: enemy.position.x + randomDir.x, y: enemy.position.y + randomDir.y };
      }
    }

    return {
      ...enemy,
      state: newState,
      position: newPosition,
      energy: Math.max(0, enemy.energy - 0.5)
    };
  };

  // Game loop for the demo
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setEnemies(prevEnemies => prevEnemies.map(updateEnemyAI));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  // Handle player movement (for demo purposes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        let newPos = { ...playerPos };
        if (e.key === 'ArrowUp') newPos.y -= 1;
        if (e.key === 'ArrowDown') newPos.y += 1;
        if (e.key === 'ArrowLeft') newPos.x -= 1;
        if (e.key === 'ArrowRight') newPos.x += 1;
        if (isValidMove(newPos.x, newPos.y)) {
            setPlayerPos(newPos);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos]);

  // A simple renderer for the demo
  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Brain/> AI Demo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maze[0].length}, 20px)` }}>
            {maze.map((row, y) => row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const enemy = enemies.find(e => e.position.x === x && e.position.y === y);
                return (
                    <div key={`${x}-${y}`} style={{
                        width: 20, height: 20,
                        backgroundColor: cell === 1 ? 'black' : 'gray',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {isPlayer ? '😊' : enemy ? '👾' : ''}
                    </div>
                );
            }))}
        </div>
        <div className="mt-4 flex gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-blue-600 rounded">
                {isRunning ? <Pause size={16}/> : <Play size={16}/>}
            </button>
            <button onClick={() => window.location.reload()} className="p-2 bg-red-600 rounded">
                <RotateCcw size={16}/>
            </button>
        </div>
    </div>
  );
  // --- End of Corrected Section ---
};

export default AIEnemyDemo;