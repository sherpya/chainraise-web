import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { readContract } from '@wagmi/core';

import { chainRaiseABI } from '@/gen/abi';

export type FetchContributionArgs = {
    /** campaignId */
    campaignId: bigint;
    /** Address of Contribution to check */
    address: Address;
    /** Contract address */
    contract?: Address;
    /** Token decimals */
    decimals?: number;
    /** Chain id to use for Public Client. */
    chainId?: number;
};

export type FetchContributionResult = {
    formatted: string;
    value: bigint;
};

export async function fetchContribution({
    campaignId,
    address,
    contract,
    decimals,
    chainId,
}: FetchContributionArgs): Promise<FetchContributionResult> {
    if (address && contract && decimals) {
        const fetchContractContribution = async () => {
            const value = await readContract({
                address: contract,
                chainId: chainId,
                abi: chainRaiseABI,
                functionName: 'contribution',
                args: [campaignId, address]
            });
            return {
                decimals,
                formatted: formatUnits(value, decimals),
                value
            };
        };

        return await fetchContractContribution();
    }

    return { formatted: '0', value: BigInt(0) };
}
