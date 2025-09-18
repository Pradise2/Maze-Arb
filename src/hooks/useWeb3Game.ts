// src/hooks/useWeb3Game.ts - Web3 Game Features Hook
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useCallback } from 'react';

// Hypothetical game contract ABI (you'd need to deploy your own)
const GAME_CONTRACT_ABI = [
  {
    inputs: [{ name: 'level', type: 'uint256' }, { name: 'score', type: 'uint256' }],
    name: 'submitScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getHighScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const CONTRACT_ADDRESS = '0x...'; // Your deployed contract address

export function useWeb3Game() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  const { data: highScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getHighScore',
    args: address ? [address] : undefined,
  });

  const submitScore = useCallback(async (level: number, score: number) => {
    if (!isConnected || !address) return;
    
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(level), BigInt(score)],
      });
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  }, [isConnected, address, writeContract]);

  return {
    address,
    isConnected,
    highScore: highScore ? Number(highScore) : 0,
    submitScore,
  };
}
