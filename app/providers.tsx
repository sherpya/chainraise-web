'use client';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';

import { bscTestnet, sepolia } from '@wagmi/core/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

import { buildbear } from './common';
import { useEffect, useState } from 'react';

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [sepolia, bscTestnet, buildbear],
    [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_APIKEY }), publicProvider()],
);

const config = createConfig({
    autoConnect: true,
    connectors: [new MetaMaskConnector({ chains })],
    publicClient,
    webSocketPublicClient,
});

export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <WagmiConfig config={config} >
            {mounted && children}
        </WagmiConfig>
    );
}
