// src/components/Web3Provider.tsx - Web3 Configuration (Fixed)
import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
// FIX 1: Import networks from the appkit library for correct typing.
import { arbitrum, mainnet, type AppKitNetwork } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 1. Get a project ID at https://cloud.reown.com
const projectId = 'YOUR_PROJECT_ID';

// 2. Create a metadata object - optional
const metadata = {
  name: 'Maze Game',
  description: 'Blockchain-enabled maze game',
  url: 'https://mymazeapp.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 3. Set the networks
// FIX 2: Add a type assertion to guarantee the array is not empty.
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}