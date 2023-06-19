'use client';

import { useNetwork } from 'wagmi';
import { SUPPORTED_NETWORKS } from '../common';

export default function UseNetworkWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { chain } = useNetwork();

    if (chain) {
        if (SUPPORTED_NETWORKS.includes(chain.id)) {
            return (<>{children}</>);
        }
        return (<div>Unsupported Network TODO switcher</div>);
    }

    return (<div>Please Connect.</div>);
}
