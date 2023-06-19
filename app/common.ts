import { Chain } from '@wagmi/core';
import { sepolia, hardhat } from '@wagmi/core/chains';
import { TransactionExecutionError } from 'viem';

import { Token, TokenMap } from './models/Token';
import { Address } from 'abitype';

const BUILDBEAR_CONTAINER_NAME = process.env.NEXT_PUBLIC_BUILDBEAR_CONTAINER_NAME || 'invalid';

export const buildbear = {
    id: parseInt(process.env.NEXT_PUBLIC_BUILDBEAR_CHAINID, 10),
    name: 'Buildbear',
    network: 'buildear',
    nativeCurrency: {
        decimals: 18,
        name: 'BB Ether',
        symbol: 'BB ETH',
    },
    rpcUrls: {
        public: { http: [`https://rpc.buildbear.io/${BUILDBEAR_CONTAINER_NAME}`] },
        default: { http: [`https://rpc.buildbear.io/${BUILDBEAR_CONTAINER_NAME}`] },
    },
    blockExplorers: {
        etherscan: { name: 'BuildBear Explorer', url: `https://explorer.buildbear.io/${BUILDBEAR_CONTAINER_NAME}` },
        default: { name: 'BuildBear Explorer', url: `https://explorer.buildbear.io/${BUILDBEAR_CONTAINER_NAME}` },
    },
    contracts: {
        ensUniversalResolver: {
            address: "0xca11bde05977b3631167028862be2a173976ca11"
        }
    }
} as const satisfies Chain;


function parseTokens(value: string): Token[] {
    return value.split(',').map((entry: string) => Token.fromEnv(entry));
}

export const TOKENS: TokenMap = {
    [sepolia.id]: [
        new Token('USDT', process.env.NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS as Address),
        new Token('USDC', process.env.NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS as Address)
    ],
    [hardhat.id]: [
        new Token('USDT', process.env.NEXT_PUBLIC_HARDHAT_USDT_ADDRESS as Address),
        new Token('USDC', process.env.NEXT_PUBLIC_HARDHAT_USDC_ADDRESS as Address)
    ],
    [buildbear.id]: [
        new Token('USDT', '0x55d398326f99059fF775485246999027B3197955'),
        new Token('USDC', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d')
    ]
};

export const SUPPORTED_NETWORKS = [
    sepolia.id,
    hardhat.id,
    buildbear.id
];

export function findToken(address: string, chainId: number) {
    for (const token of TOKENS[chainId] || []) {
        if (address.toLowerCase() == token.address.toLowerCase()) {
            return token;
        }
    }
    throw new Error(`Unsupported token at: ${address}`);
}

export function formatError(error: Error) {
    if (error instanceof TransactionExecutionError) {
        return (error as TransactionExecutionError).shortMessage;
    } else {
        return error.message;
    }
}
