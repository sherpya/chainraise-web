import * as React from 'react';
import { useBlockNumber, useChainId, useQuery } from 'wagmi';

import {
  FetchAllowanceArgs,
  FetchAllowanceResult,
  fetchAllowance,
} from '../accounts/fetchAllowance';
import { QueryConfig, QueryFunctionArgs } from '../types';

export type UseAllowanceArgs = Partial<FetchAllowanceArgs> & {
  /** Subscribe to changes */
  watch?: boolean;
};

export type UseAllowanceConfig = QueryConfig<FetchAllowanceResult, Error>;

export const queryKey = ({ owner, spender, token, chainId }
  : Partial<FetchAllowanceArgs> & { chainId?: number; }) =>
  [{
    entity: 'allowance',
    owner,
    spender,
    token,
    chainId
  }] as const;

const queryFn = ({ queryKey: [{ owner, spender, token, chainId }] }
  : QueryFunctionArgs<typeof queryKey>) => {
  if (!owner) throw new Error('owner address is required');
  if (!spender) throw new Error('spender address is required');
  if (!token) throw new Error('token is required');
  return fetchAllowance({ owner, spender, token, chainId });
};

export function useAllowance({
  owner,
  spender,
  token,
  cacheTime,
  chainId: chainId_,
  enabled = true,
  staleTime,
  suspense,
  watch,
  onError,
  onSettled,
  onSuccess
}: UseAllowanceArgs & UseAllowanceConfig = {}) {
  const chainId = useChainId({ chainId: chainId_ });
  const allowanceQuery = useQuery(
    queryKey({
      owner,
      spender,
      token,
      chainId
    }),
    queryFn,
    {
      cacheTime,
      enabled: Boolean(enabled && owner && spender),
      staleTime,
      suspense,
      onError,
      onSettled,
      onSuccess
    }
  );

  const { data: blockNumber } = useBlockNumber({ chainId, watch });
  React.useEffect(() => {
    if (!enabled) return;
    if (!watch) return;
    if (!blockNumber) return;
    if (!token) return;
    if (!owner) return;
    if (!owner) return;
    allowanceQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  return allowanceQuery;
}
