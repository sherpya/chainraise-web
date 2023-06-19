import { getContract } from '@wagmi/core';
import { Address } from 'wagmi';
import { chainRaiseABI } from '@/gen/abi';


export function getChainRaiseContract() {
  return getContract({
    address: process.env.NEXT_PUBLIC_CHAINRAISE_ADDRESS as Address,
    abi: chainRaiseABI
  });
}
