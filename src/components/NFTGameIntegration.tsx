// components/NFTGameIntegration.tsx - Complete NFT integration for maze game (Corrected)
import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Zap, Trophy, Star, Crown, Gift } from 'lucide-react';
import { useNFTEcosystem } from '../hooks/useNFTEcosystem';

interface NFTGameIntegrationProps {
  gameState: 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'completed';
  gameStats: {
    gamesPlayed: number;
    perfectRuns: number;
    aiInteractions: number;
    currentLevel: number;
    score: number;
    timeLeft: number;
  };
  onThemeChange?: (theme: string) => void;
  onLevelLoad?: (levelData: any) => void;
}

export const NFTGameIntegration: React.FC<NFTGameIntegrationProps> = ({
  gameState,
  gameStats,
  onThemeChange,
  onLevelLoad
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'levels' | 'rewards'>('skins');
  const [selectedSkin, setSelectedSkin] = useState<any>(null);
  const [pendingRewards, setPendingRewards] = useState<any[]>([]);

  const {
    playerNFTs,
    isLoading,
    error,
    mintCharacterSkin,
    updateNFTProgress,
    refetch
  } = useNFTEcosystem();

  // Update NFT progress when game ends
  useEffect(() => {
    if (gameState === 'won' || gameState === 'lost') {
      // Find active character skin to update
      const activeSkin = playerNFTs.find(nft => 
        nft.nftType === 'CHARACTER_SKIN' && selectedSkin?.tokenId === nft.tokenId
      );
      
      if (activeSkin) {
        updateNFTProgress(activeSkin.tokenId, {
          gamesPlayed: 1,
          perfectRuns: gameState === 'won' && gameStats.timeLeft > 0 ? 1 : 0,
          aiInteractions: gameStats.aiInteractions
        });
      }
    }
  }, [gameState, gameStats, playerNFTs, selectedSkin, updateNFTProgress]);

  // Check for new rewards based on achievements
  useEffect(() => {
    checkForNewRewards();
  }, [gameStats]);

  const checkForNewRewards = useCallback(() => {
    const rewards = [];
    
    // First game milestone
    if (gameStats.gamesPlayed === 1 && playerNFTs.length === 0) {
      rewards.push({
        type: 'FIRST_GAME_SKIN',
        title: 'Welcome Reward!',
        description: 'Complete your first game to earn a Starter Skin NFT',
        rarity: 0, // Common
        ready: gameState === 'won' || gameState === 'lost'
      });
    }
    
    // Perfect run rewards
    if (gameStats.perfectRuns > 0 && gameStats.perfectRuns % 5 === 0) {
      rewards.push({
        type: 'PERFECT_STREAK',
        title: `${gameStats.perfectRuns} Perfect Runs!`,
        description: 'Earn a rare skin for your perfect gameplay',
        rarity: Math.min(3, Math.floor(gameStats.perfectRuns / 5)), // Up to Epic
        ready: true
      });
    }
    
    // AI interaction milestone
    if (gameStats.aiInteractions >= 100) {
      rewards.push({
        type: 'AI_MASTER',
        title: 'AI Collaboration Master',
        description: 'Unlock exclusive AI-themed character skin',
        rarity: 2, // Rare
        ready: true
      });
    }

    setPendingRewards(rewards.filter(r => r.ready));
  }, [gameStats, gameState, playerNFTs]);

  const claimReward = async (reward: any) => {
    try {
      await mintCharacterSkin(reward.rarity, JSON.stringify({
        rewardType: reward.type,
        earnedAt: Date.now(),
        gameStats: gameStats
      }));
      
      setPendingRewards(prev => prev.filter(r => r !== reward));
      refetch();
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const characterSkins = playerNFTs.filter(nft => nft.nftType === 'CHARACTER_SKIN');
  const levelDesigns = playerNFTs.filter(nft => nft.nftType === 'LEVEL_DESIGN');

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'EPIC': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'RARE': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'UNCOMMON': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed top-4 left-4 z-40">
      {/* Main NFT Panel */}
      <div className="bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 min-w-[300px]">
        
        {/* Header with Tabs */}
        <div className="flex items-center border-b border-white/10">
          <button
            onClick={() => setActiveTab('skins')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'skins' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Palette size={16} className="inline mr-2" />
            Skins ({characterSkins.length})
          </button>
          
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'levels' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Star size={16} className="inline mr-2" />
            Levels ({levelDesigns.length})
          </button>
          
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'rewards' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gift size={16} className="inline mr-2" />
            Rewards
            {pendingRewards.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRewards.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          
          {/* Character Skins Tab */}
          {activeTab === 'skins' && (
            <div className="space-y-3">
              {characterSkins.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Palette size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No character skins yet</p>
                  <p className="text-xs">Play games to earn your first NFT skin!</p>
                </div>
              ) : (
                characterSkins.map(skin => (
                  <div
                    key={skin.tokenId}
                    onClick={() => {
                      setSelectedSkin(skin);
                      // Apply theme change if available
                      onThemeChange?.(skin.attributes.theme || 'default');
                    }}
                    className={`
                      p-3 rounded-lg border transition-all cursor-pointer hover:scale-102
                      ${selectedSkin?.tokenId === skin.tokenId 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Skin Preview */}
                      <div className={`w-12 h-12 rounded-lg ${getRarityGradient(skin.rarity)} p-0.5`}>
                        <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🎭</span>
                        </div>
                      </div>
                      
                      {/* Skin Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">#{skin.tokenId}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRarityGradient(skin.rarity)} text-white`}>
                            {skin.rarity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Level {skin.level} • {skin.experience.toLocaleString()} XP
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, (skin.experience % 1000) / 10)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {selectedSkin?.tokenId === skin.tokenId && (
                        <Crown size={16} className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Level Designs Tab */}
          {activeTab === 'levels' && (
            <div className="space-y-3">
              {levelDesigns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Star size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No custom levels created</p>
                  <p className="text-xs">Use the level designer to create NFT levels!</p>
                </div>
              ) : (
                levelDesigns.map(level => (
                  <div
                    key={level.tokenId}
                    className="p-3 rounded-lg border border-gray-600 bg-gray-800/50 hover:border-gray-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Level #{level.tokenId}</span>
                      <button
                        onClick={() => onLevelLoad?.(level)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                      >
                        Load
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Difficulty: {level.level} • Played: {level.gamesPlayed} times
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-3">
              {pendingRewards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Trophy size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No pending rewards</p>
                  <p className="text-xs">Keep playing to unlock achievements!</p>
                </div>
              ) : (
                pendingRewards.map((reward, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold">{reward.title}</h3>
                        <p className="text-sm text-gray-300">{reward.description}</p>
                      </div>
                      <Zap size={20} className="text-yellow-400" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityGradient(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][reward.rarity])} text-white`}>
                        {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][reward.rarity]} Rarity
                      </span>
                      <button
                        onClick={() => claimReward(reward)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
                      >
                        {isLoading ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-white/10 p-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-gray-400">Total NFTs</div>
              <div className="text-white font-bold">{playerNFTs.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Games Played</div>
              <div className="text-white font-bold">{gameStats.gamesPlayed}</div>
            </div>
            <div>
              <div className="text-gray-400">Perfect Runs</div>
              <div className="text-white font-bold">{gameStats.perfectRuns}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Skin Indicator */}
      {selectedSkin && gameState === 'playing' && (
        <div className="mt-3 p-2 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${getRarityGradient(selectedSkin.rarity)}`} />
            <span className="text-white">Active: Skin #{selectedSkin.tokenId}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-900/50 backdrop-blur-sm rounded-lg border border-red-500/50">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};