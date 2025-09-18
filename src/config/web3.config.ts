
// src/config/web3.config.ts - Web3 Configuration
export const WEB3_CONFIG = {
  // Replace with your actual project ID from https://cloud.reown.com
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE',
  
  // Contract addresses (deploy contracts and update these)
  contracts: {
    mazeGameCore: process.env.REACT_APP_MAZE_GAME_CONTRACT || '0x742d35Cc6634C0532925a3b8D654A1C0',
    mazeGameNFT: process.env.REACT_APP_MAZE_NFT_CONTRACT || '0x742d35Cc6634C0532925a3b8D654A1C1',
    mazeGameTournament: process.env.REACT_APP_TOURNAMENT_CONTRACT || '0x742d35Cc6634C0532925a3b8D654A1C2'
  },
  
  // Chain configuration
  defaultChain: 'arbitrum',
  supportedChains: ['arbitrum', 'sepolia'] as const,
  
  // App metadata
  metadata: {
    name: 'Maze Master Game',
    description: 'Blockchain-enabled maze game with NFT achievements',
    url: 'https://mazegame.app',
    icons: ['https://mazegame.app/icon-192x192.png']
  }
};
