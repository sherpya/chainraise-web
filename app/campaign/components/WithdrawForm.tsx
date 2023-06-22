import { useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

import { findToken } from '@/app/common';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { useContribution } from '@/app/hooks/useContribution';
import { Campaign } from '@/app/models/Campaign';

export default function WithdrawForm({ campaign }: { campaign: Campaign; }) {
    const chain = useNetwork().chain!;
    const chainRaise = getChainRaiseContract();
    const account = useAccount();

    const { data: contribution } = useContribution({
        campaignId: campaign.campaignId,
        address: account.address,
        contract: chainRaise.address,
        decimals: campaign.token.decimals,
        watch: true
    });

    const [error, setError] = useState<string | null>(null);

    /*
    const [disabled, setDisabled] = useState(false);
    const [busy, setBusy] = useState(false);
    */

    return (
        <div className="container">
            <div>Contribution: {contribution && contribution.formatted} {campaign.token.name}</div>
            {error && <pre>{error}</pre>}
        </div>
    );
};
