import { Address, ResolvedConfig } from 'abitype';
import { readContracts, Unit } from 'wagmi';
import { ContractFunctionExecutionError, Hex, formatUnits, hexToString, trim } from 'viem';

import { erc20ABI, erc20ABI_bytes32 } from '../constants';
import { getUnit } from '../utils/getUnit';

export type FetchAllowanceArgs = {
  /** Owner Address */
  owner: Address;
  /** Spender Address */
  spender: Address;
  /** Chain id to use for provider */
  chainId?: number;
  /** Units for formatting output */
  formatUnits?: Unit | number;
  /** ERC-20 address */
  token: Address;
};

export type FetchAllowanceResult = {
  decimals: ResolvedConfig['IntType'];
  formatted: string;
  symbol: string;
  value: ResolvedConfig['BigIntType'];
};

export async function fetchAllowance({
  owner,
  spender,
  chainId,
  formatUnits: unit,
  token,
}: FetchAllowanceArgs): Promise<FetchAllowanceResult> {
  type FetchContractAllowance = {
    abi: typeof erc20ABI | typeof erc20ABI_bytes32;
  };
  const fetchContractAllowance = async ({ abi }: FetchContractAllowance) => {
    const erc20Config = { abi, address: token, chainId } as const;
    const [value, decimals, symbol] = await readContracts({
      allowFailure: false,
      contracts: [
        {
          ...erc20Config,
          functionName: 'allowance',
          args: [owner, spender],
        },
        { ...erc20Config, functionName: 'decimals' },
        { ...erc20Config, functionName: 'symbol' },
      ],
    });
    return {
      decimals,
      formatted: formatUnits(value ?? '0', getUnit(unit ?? decimals)),
      symbol: symbol as string, // protect against `ResolvedConfig['BytesType']`
      value,
    };
  };

  try {
    return await fetchContractAllowance({ abi: erc20ABI });
  } catch (err) {
    // In the chance that there is an error upon decoding the contract result,
    // it could be likely that the contract data is represented as bytes32 instead
    // of a string.
    if (err instanceof ContractFunctionExecutionError) {
      const { symbol, ...rest } = await fetchContractAllowance({
        abi: erc20ABI_bytes32,
      });
      return {
        symbol: hexToString(trim(symbol as Hex, { dir: 'right' })),
        ...rest,
      };
    }
    throw err;
  }
}
