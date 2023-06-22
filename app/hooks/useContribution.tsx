import * as React from 'react';
import { QueryConfig, QueryFunctionArgs } from '@/src/wagmi/types';
import { useBlockNumber, useChainId, useQuery, useQueryClient } from 'wagmi';
import { QueryKey } from '@tanstack/react-query';

import { fetchContribution } from './fetchContribution';
import type { FetchContributionArgs, FetchContributionResult } from './fetchContribution';

export type UseContributionArgs = Partial<FetchContributionArgs> & {
    /** Subscribe to changes */
    watch?: boolean;
};

export type UseContributionConfig = QueryConfig<FetchContributionResult, Error>;

type QueryKeyArgs = Partial<FetchContributionArgs>;
type QueryKeyConfig = Pick<UseContributionConfig, 'scopeKey'>;

function queryKey({
    campaignId,
    address,
    contract,
    decimals,
    chainId,
    scopeKey,
}: QueryKeyArgs & QueryKeyConfig) {
    return [{
        entity: 'Contribution',
        campaignId,
        address,
        contract,
        decimals,
        chainId,
        scopeKey,
    }] as const;
}

function queryFn({
    queryKey: [{
        campaignId,
        address,
        contract,
        decimals,
        chainId
    }],
}: QueryFunctionArgs<typeof queryKey>) {
    if (!campaignId) throw new Error('campaignId is required');
    if (!address) throw new Error('address is required');
    return fetchContribution({ campaignId, address, contract, decimals, chainId });
}

function useInvalidateOnBlock({
    chainId,
    enabled,
    queryKey
}: {
    chainId?: number;
    enabled?: boolean;
    queryKey: QueryKey;
}) {
    const queryClient = useQueryClient();

    const onBlock = React.useCallback(
        () => queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false }),
        [queryClient, queryKey],
    );

    useBlockNumber({
        chainId,
        enabled,
        onBlock: enabled ? onBlock : undefined,
        scopeKey: enabled ? undefined : 'idle'
    });
}

export function useContribution({
    campaignId,
    address,
    contract,
    decimals,
    chainId: chainId_,
    cacheTime,
    enabled = true,
    scopeKey,
    staleTime,
    suspense,
    watch
}: UseContributionArgs & UseContributionConfig = {}) {
    const chainId = useChainId({ chainId: chainId_ });
    const queryKey_ = React.useMemo(
        () => queryKey({ campaignId, address, contract, decimals, chainId, scopeKey }),
        [address, campaignId, chainId, contract, decimals, scopeKey],
    );
    const ContributionQuery = useQuery(queryKey_, queryFn, {
        cacheTime,
        enabled: Boolean(enabled && address),
        staleTime,
        suspense
    });

    useInvalidateOnBlock({
        chainId,
        enabled: Boolean(enabled && watch && address),
        queryKey: queryKey_
    });

    return ContributionQuery;
}
