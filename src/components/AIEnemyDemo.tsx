// components/AIEnemyDemo.tsx - Standalone AI Demo
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

  const updateEnemyAI = (enemy: DemoEnemy): DemoEnemy => {
    const distanceToPlayer
