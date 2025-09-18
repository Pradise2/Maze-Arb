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
                      <span>{Math.min(100, (nft.experience % 1000) / 10).to
