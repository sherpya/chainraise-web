import { JsonRpcProvider, FallbackProvider } from '@ethersproject/providers';

import { CONTRACT_ADDRESSES } from '@/app/common';
import { ChainRaise__factory } from '@/gen/types/factories/ChainRaise__factory';


export function getChainRaiseContract(provider: JsonRpcProvider | FallbackProvider) {
  const chainId = provider?.network?.chainId ?? 0;

  if (!chainId) {
    throw new Error('Invalid chainId');
  }

  const chainRaiseAddress = CONTRACT_ADDRESSES[chainId];
  return ChainRaise__factory.connect(chainRaiseAddress, provider);
}
