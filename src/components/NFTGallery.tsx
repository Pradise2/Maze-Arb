// components/NFTGallery.tsx - NFT Display Component (Corrected)
import React, { useState } from 'react';
import { Crown, Zap, Star, Gamepad2 } from 'lucide-react';
import type { NFTMetadata } from '../hooks/useNFTEcosystem';

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
        <h2 className="text-22xl font-bold text-white">NFT Collection</h2>
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