// components/NFTLevelDesigner.tsx - Level Design NFT Creator (Corrected)
import React, { useState } from 'react';

interface NFTLevelDesignerProps {
  onCreateLevel: (levelData: any) => void;
  isAIEnabled: boolean;
}

// --- Start of Corrected Section ---

// Utility functions for level generation moved before the component
function generateBasicMaze(width: number, height: number): number[][] {
  // Basic maze generation algorithm (this would be more sophisticated in practice)
  const maze = Array(height).fill(null).map(() => Array(width).fill(1));
  
  // Simple path carving
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      maze[y][x] = 0; // Create path
      if (Math.random() > 0.5 && x + 2 < width - 1) maze[y][x + 1] = 0;
      if (Math.random() > 0.5 && y + 2 < height - 1) maze[y + 1][x] = 0;
    }
  }
  
  maze[1][1] = 2; // Player start
  maze[height - 2][width - 2] = 3; // Exit
  
  const pathCells: { x: number, y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (maze[y][x] === 0) pathCells.push({ x, y });
    }
  }
  
  const collectibleCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < Math.min(collectibleCount, pathCells.length); i++) {
    const cell = pathCells[Math.floor(Math.random() * pathCells.length)];
    maze[cell.y][cell.x] = 4; // Collectible
    pathCells.splice(pathCells.indexOf(cell), 1);
  }
  
  return maze;
}

async function generateAILevel(size: { width: number; height: number }, difficulty: number) {
  // This would integrate with an AI service in a real application
  return {
    maze: generateBasicMaze(size.width, size.height),
    difficulty,
    complexity: Math.floor((size.width + size.height) / 2) + difficulty,
    isAIGenerated: true,
    metadata: { algorithm: 'AI-Enhanced', theme: 'Procedural' }
  };
}

async function generateBasicLevel(size: { width: number; height: number }, difficulty: number) {
  return {
    maze: generateBasicMaze(size.width, size.height),
    difficulty,
    complexity: Math.floor((size.width + size.height) / 2),
    isAIGenerated: false,
    metadata: { algorithm: 'Recursive Backtracking', theme: 'Classic' }
  };
}

// --- End of Helper Functions ---

export const NFTLevelDesigner: React.FC<NFTLevelDesignerProps> = ({
  onCreateLevel,
  isAIEnabled
}) => {
  const [mazeSize, setMazeSize] = useState({ width: 15, height: 15 });
  const [difficulty, setDifficulty] = useState(1);
  const [useAI, setUseAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLevel = async () => {
    setIsGenerating(true);
    
    try {
      if (useAI && isAIEnabled) {
        const aiLevelData = await generateAILevel(mazeSize, difficulty);
        onCreateLevel(aiLevelData);
      } else {
        const manualLevelData = await generateBasicLevel(mazeSize, difficulty);
        onCreateLevel(manualLevelData);
      }
    } catch (error) {
      console.error('Failed to generate level:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl text-white">
      <h2 className="text-2xl font-bold mb-6">Create Level Design NFT</h2>
      
      <div className="space-y-6">
        {/* Size Controls */}
        <div>
          <label className="block text-sm font-medium mb-2">Maze Size</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Width</label>
              <input
                type="range"
                min="9"
                max="25"
                step="2"
                value={mazeSize.width}
                onChange={(e) => setMazeSize((prev: { width: number; height: number }) => ({ 
                  ...prev, 
                  width: parseInt(e.target.value) 
                }))}
                className="w-full"
              />
              <span className="text-sm">{mazeSize.width}</span>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height</label>
              <input
                type="range"
                min="9"
                max="25"
                step="2"
                value={mazeSize.height}
                onChange={(e) => setMazeSize((prev: { width: number; height: number }) => ({ 
                  ...prev, 
                  height: parseInt(e.target.value) 
                }))}
                className="w-full"
              />
              <span className="text-sm">{mazeSize.height}</span>
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Difficulty: {['Easy', 'Normal', 'Hard', 'Expert', 'Master'][difficulty - 1]}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* AI Generation Toggle */}
        {isAIEnabled && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="useAI" className="text-sm">
              Use AI Generation (Higher rarity potential)
            </label>
          </div>
        )}

        {/* Generation Stats Preview */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3">Estimated NFT Properties</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Complexity Score:</span>
              <span className="ml-2 font-medium">
                {Math.floor((mazeSize.width + mazeSize.height) / 2) + difficulty}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Expected Rarity:</span>
              <span className="ml-2 font-medium">
                {(() => {
                  const score = Math.floor((mazeSize.width + mazeSize.height) / 2) + difficulty;
                  if (useAI) return score >= 12 ? 'Epic-Legendary' : 'Rare-Epic';
                  if (score >= 15) return 'Legendary';
                  if (score >= 12) return 'Epic';
                  if (score >= 9) return 'Rare';
                  if (score >= 6) return 'Uncommon';
                  return 'Common';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateLevel}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold transition-all duration-200"
        >
          {isGenerating ? 'Generating Level...' : 'Create Level Design NFT'}
        </button>
      </div>
    </div>
  );
};