// hooks/useNFTEcosystem.ts - NFT Integration Hook (Corrected)
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
      await writeContract({
        address: DYNAMIC_NFT_CONTRACT,
        abi: DYNAMIC_NFT_ABI,
        functionName: 'mintCharacterSkin',
        args: [address, rarity, customAttributes],
      });

      // In a real app, you'd listen for the transaction receipt to get the token ID
      return 1; // Placeholder
    } catch (err: any) {
      setError(`Failed to mint character skin: ${err.message}`);
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
    } catch (err: any) {
      setError(`Failed to update NFT progress: ${err.message}`);
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
    } catch (err: any) {
      setError(`Failed to fetch NFT metadata: ${err.message}`);
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