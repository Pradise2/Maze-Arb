// hooks/useNFTEcosystem.ts - NFT Integration Hook
import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import type { Address } from 'viem';

export interface NFTMetadata {
  tokenId: number;
  nftType: 'CHARACTER_SKIN' | 'LEVEL_DESIGN' | 'ACHIEVEMENT_BADGE' | 'AI_COMPANION';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  level: number;
  experience: number;
  gamesPlayed: number;
  perfectRuns: number;
  aiInteractions: number;
  isEvolvable: boolean;
  imageUrl: string;
  attributes: Record<string, any>;
}

export interface LevelDesignNFT extends NFTMetadata {
  difficulty: number;
  complexity: number;
  timesPlayed: number;
  averageRating: number;
  totalRatings: number;
  designer: Address;
  isAIGenerated: boolean;
  mazeData: string;
}

const DYNAMIC_NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'rarity', type: 'uint8' },
      { name: 'customAttributes', type: 'string' }
    ],
    name: 'mintCharacterSkin',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'gamesPlayed', type: 'uint256' },
      { name: 'perfectRuns', type: 'uint256' },
      { name: 'aiInteractions', type: 'uint256' }
    ],
    name: 'updateNFTProgress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'nftType', type: 'uint8' }],
    name: 'getNFTsByType',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'nftMetadata',
    outputs: [
      { name: 'nftType', type: 'uint8' },
      { name: 'rarity', type: 'uint8' },
      { name: 'level', type: 'uint256' },
      { name: 'experience', type: 'uint256' },
      { name: 'gamesPlayed', type: 'uint256' },
      { name: 'perfectRuns', type: 'uint256' },
      { name: 'aiInteractions', type: 'uint256' },
      { name: 'isEvolvable', type: 'bool' },
      { name: 'lastUpdated', type: 'uint256' },
      { name: 'customAttributes', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const DYNAMIC_NFT_CONTRACT = process.env.NEXT_PUBLIC_DYNAMIC_NFT_CONTRACT as Address;

export const useNFTEcosystem = () => {
  const { address, isConnected } = useAccount();
  const [playerNFTs, setPlayerNFTs] = useState<NFTMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract } = useWriteContract();

  // Get player's character skins
  const { data: characterSkinIds } = useReadContract({
    address: DYNAMIC_NFT_CONTRACT,
    abi: DYNAMIC_NFT_ABI,
    functionName: 'getNFTsByType',
    args: address ? [address, 0] : undefined, // 0 = CHARACTER_SKIN
  });

  // Get player's level designs
  const { data: levelDesignIds } = useReadContract({
    address: DYNAMIC_NFT_CONTRACT,
    abi: DYNAMIC_NFT_ABI,
    functionName: 'getNFTsByType',
    args: address ? [address, 1] : undefined, // 1 = LEVEL_DESIGN
  });

  // Mint a character skin NFT
  const mintCharacterSkin = useCallback(async (
    rarity: number,
    customAttributes: string
  ): Promise<number | null> => {
    if (!address) return null;

    try {
      setIsLoading(true);
      const result = await writeContract({
        address: DYNAMIC_NFT_CONTRACT,
        abi: DYNAMIC_NFT_ABI,
        functionName: 'mintCharacterSkin',
        args: [address, rarity, customAttributes],
      });

      // In a real app, you'd listen for the transaction receipt to get the token ID
      return 1; // Placeholder
    } catch (err) {
      setError(`Failed to mint character skin: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Update NFT progress after gameplay
  const updateNFTProgress = useCallback(async (
    tokenId: number,
    gameStats: {
      gamesPlayed: number;
      perfectRuns: number;
      aiInteractions: number;
    }
  ) => {
    if (!address) return;

    try {
      await writeContract({
        address: DYNAMIC_NFT_CONTRACT,
        abi: DYNAMIC_NFT_ABI,
        functionName: 'updateNFTProgress',
        args: [
          BigInt(tokenId),
          BigInt(gameStats.gamesPlayed),
          BigInt(gameStats.perfectRuns),
          BigInt(gameStats.aiInteractions)
        ],
      });
    } catch (err) {
      setError(`Failed to update NFT progress: ${err}`);
    }
  }, [address, writeContract]);

  // Fetch NFT metadata for all player NFTs
  const fetchNFTMetadata = useCallback(async () => {
    if (!characterSkinIds && !levelDesignIds) return;

    setIsLoading(true);
    try {
      const allTokenIds = [
        ...(characterSkinIds || []),
        ...(levelDesignIds || [])
      ];

      // In a real implementation, you'd batch these calls
      const nftPromises = allTokenIds.map(async (tokenId) => {
        // Fetch metadata from contract or IPFS
        // This is simplified - you'd use multicall or batch requests
        return {
          tokenId: Number(tokenId),
          nftType: 'CHARACTER_SKIN' as const,
          rarity: 'COMMON' as const,
          level: 1,
          experience: 0,
          gamesPlayed: 0,
          perfectRuns: 0,
          aiInteractions: 0,
          isEvolvable: true,
          imageUrl: `https://api.mazegame.com/nft/${tokenId}`,
          attributes: {}
        };
      });

      const nfts = await Promise.all(nftPromises);
      setPlayerNFTs(nfts);
    } catch (err) {
      setError(`Failed to fetch NFT metadata: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [characterSkinIds, levelDesignIds]);

  useEffect(() => {
    if (isConnected && address) {
      fetchNFTMetadata();
    }
  }, [isConnected, address, fetchNFTMetadata]);

  return {
    playerNFTs,
    isLoading,
    error,
    mintCharacterSkin,
    updateNFTProgress,
    refetch: fetchNFTMetadata
  };
};

// components/NFTGallery.tsx - NFT Display Component
import React, { useState } from 'react';
import { Crown, Zap, Star, Gamepad2 } from 'lucide-react';

interface NFTGalleryProps {
  nfts: NFTMetadata[];
  onSelectNFT?: (nft: NFTMetadata) => void;
  selectedNFT?: NFTMetadata | null;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({
  nfts,
  onSelectNFT,
  selectedNFT
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'border-yellow-400 bg-yellow-50';
      case 'EPIC': return 'border-purple-400 bg-purple-50';
      case 'RARE': return 'border-blue-400 bg-blue-50';
      case 'UNCOMMON': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return <Crown className="text-yellow-500" size={16} />;
      case 'EPIC': return <Zap className="text-purple-500" size={16} />;
      case 'RARE': return <Star className="text-blue-500" size={16} />;
      default: return <Gamepad2 className="text-gray-500" size={16} />;
    }
  };

  const filteredNFTs = nfts.filter(nft => 
    filter === 'ALL' || nft.nftType === filter
  );

  return (
    <div className="p-6 bg-gray-900 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">NFT Collection</h2>
        <div className="flex gap-2">
          {['ALL', 'CHARACTER_SKIN', 'LEVEL_DESIGN', 'ACHIEVEMENT_BADGE'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type === 'ALL' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-white mb-2">No NFTs Found</h3>
          <p className="text-gray-400">Play games to earn your first NFT!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map(nft => (
            <div
              key={nft.tokenId}
              onClick={() => onSelectNFT?.(nft)}
              className={`
                p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105
                ${getRarityColor(nft.rarity)}
                ${selectedNFT?.tokenId === nft.tokenId ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* NFT Image */}
              <div className="aspect-square mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                <img
                  src={nft.imageUrl}
                  alt={`NFT #${nft.tokenId}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to generated image
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml,${encodeURIComponent(`
                      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="200" fill="#1f2937"/>
                        <text x="100" y="100" text-anchor="middle" fill="white" font-size="24">
                          #${nft.tokenId}
                        </text>
                        <text x="100" y="130" text-anchor="middle" fill="#9ca3af" font-size="12">
                          ${nft.nftType.replace('_', ' ')}
                        </text>
                      </svg>
                    `)}`;
                  }}
                />
              </div>

              {/* NFT Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">#{nft.tokenId}</h3>
                  <div className="flex items-center gap-1">
                    {getRarityIcon(nft.rarity)}
                    <span className="text-xs font-medium">{nft.rarity}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {nft.nftType.replace('_', ' ')}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="font-medium">Level</div>
                    <div className="text-lg font-bold">{nft.level}</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="font-medium">XP</div>
                    <div className="text-lg font-bold">{nft.experience.toLocaleString()}</div>
                  </div>
                </div>

                {/* Evolution Status */}
                {nft.isEvolvable && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Evolution Progress</span>
                      <span>{Math.min(100, (nft.experience % 1000) / 10).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (nft.experience % 1000) / 10)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// components/NFTLevelDesigner.tsx - Level Design NFT Creator
interface NFTLevelDesignerProps {
  onCreateLevel: (levelData: any) => void;
  isAIEnabled: boolean;
}

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
        // AI-generated level
        const aiLevelData = await generateAILevel(mazeSize, difficulty);
        onCreateLevel(aiLevelData);
      } else {
        // Manual level creation
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
                onChange={(e) => setMazeSize(prev => ({ 
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
                onChange={(e) => setMazeSize(prev => ({ 
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

// Utility functions for level generation
async function generateAILevel(size: { width: number; height: number }, difficulty: number) {
  // This would integrate with your AI service
  return {
    maze: generateBasicMaze(size.width, size.height),
    difficulty,
    complexity: Math.floor((size.width + size.height) / 2) + difficulty,
    isAIGenerated: true,
    metadata: {
      algorithm: 'AI-Enhanced',
      theme: 'Procedural',
      features: ['Dynamic Paths', 'Smart Enemy Placement']
    }
  };
}

async function generateBasicLevel(size: { width: number; height: number }, difficulty: number) {
  return {
    maze: generateBasicMaze(size.width, size.height),
    difficulty,
    complexity: Math.floor((size.width + size.height) / 2),
    isAIGenerated: false,
    metadata: {
      algorithm: 'Recursive Backtracking',
      theme: 'Classic',
      features: ['Traditional Layout']
    }
  };
}

function generateBasicMaze(width: number, height: number): number[][] {
  // Basic maze generation algorithm
  const maze = Array(height).fill(null).map(() => Array(width).fill(1));
  
  // Simple path carving (this would be more sophisticated in practice)
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      maze[y][x] = 0; // Create path
      
      // Randomly connect to adjacent cells
      if (Math.random() > 0.5 && x + 2 < width - 1) {
        maze[y][x + 1] = 0;
      }
      if (Math.random() > 0.5 && y + 2 < height - 1) {
        maze[y + 1][x] = 0;
      }
    }
  }
  
  // Add entrance and exit
  maze[1][1] = 2; // Player start
  maze[height - 2][width - 2] = 3; // Exit
  
  // Add some collectibles
  const pathCells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (maze[y][x] === 0) pathCells.push({ x, y });
    }
  }
  
  // Place 3-5 collectibles randomly
  const collectibleCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < Math.min(collectibleCount, pathCells.length); i++) {
    const cell = pathCells[Math.floor(Math.random() * pathCells.length)];
    maze[cell.y][cell.x] = 4; // Collectible
    pathCells.splice(pathCells.indexOf(cell), 1);
  }
  
  return maze;
}
