'use client';

import { useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

import { findToken } from '@/app/common';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { useContribution } from '@/app/hooks/useContribution';

export default function WithdrawForm({ campaignId, address }: { campaignId: bigint, address: string; }) {
    const chain = useNetwork().chain!;
    const chainRaise = getChainRaiseContract();
    const account = useAccount();
    const token = findToken(address, chain.id);

    const { data: contribution } = useContribution({
        campaignId,
        address: account.address,
        contract: chainRaise.address,
        decimals: token.decimals,
        watch: true
    });

    const [error, setError] = useState<string | null>(null);

    /*
    const [disabled, setDisabled] = useState(false);
    const [busy, setBusy] = useState(false);
    */

    return (
        <div className="container">
            <div>Contribution: {contribution && contribution.formatted} {token.name}</div>
            {error && <pre>{error}</pre>}
        </div>
    );
};
