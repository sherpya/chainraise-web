import { ChainId } from '@usedapp/core';
import { Token, TokenMap } from './models/Token';

export const TOKENS: TokenMap = {
    [ChainId.Hardhat]: [
        new Token('USDT', process.env.NEXT_PUBLIC_HARDHAT_USDT_ADDRESS),
        new Token('USDC', process.env.NEXT_PUBLIC_HARDHAT_USDC_ADDRESS)
    ],
    [ChainId.BSC]: [
        new Token('USDT', '0x55d398326f99059ff775485246999027b3197955'),
        new Token('USDC', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d')
    ]
};

type ContractMap = {
    [key: string]: string;
};

export const CONTRACT_ADDRESSES: ContractMap = {
    [ChainId.Hardhat]: process.env.NEXT_PUBLIC_HARDHAT_CHAINRAISE_ADDRESS
};

export const SUPPORTED_NETWORKS = [
    ChainId.Hardhat
];

export function findToken(address: string, chainId: number) {
    for (const token of TOKENS[chainId] || []) {
        if (address.toLowerCase() == token.address.toLowerCase()) {
            return token;
        }
    }
    throw new Error(`Unsupported token at: ${address}`);
}
