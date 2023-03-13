'use client';

import { useEthers } from '@usedapp/core';
import { SUPPORTED_NETWORKS } from '../common';

export default function UseEthersWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    const { library } = useEthers();

    if (library?.network) {
        if (SUPPORTED_NETWORKS.includes(library.network.chainId)) {
            return (<>{children}</>);
        }
        return (<div>Unsupported Network TODO switcher</div>);
    }

    return (<div>Connecting...</div>);
}
