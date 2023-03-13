'use client';

import { DAppProvider, Config, Hardhat } from '@usedapp/core';

const config: Config = {
    readOnlyChainId: Hardhat.chainId,
    readOnlyUrls: {
        [Hardhat.chainId]: 'http://localhost:8545'
    },
    networks: [Hardhat]
    //multicallVersion: 2 as const
};

export function Providers({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DAppProvider config={config} >
            {children}
        </DAppProvider>
    );
}
