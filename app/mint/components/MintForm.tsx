'use client';

import * as yup from 'yup';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';
import { parseUnits } from 'viem';
import { useAccount, useBalance, useNetwork, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi';

import { Token } from '@/app/models/Token';
import { mintableTokenABI } from '@/gen/abi';
import { TOKENS, findToken, formatError } from '@/app/common';

export default function MintForm() {
    const chain = useNetwork().chain!;
    const account = useAccount();

    const mintSchema = yup.object({
        token: yup.string().required(),
        amount: yup.number()
            .typeError('amount is required')
            .required()
            .positive('amount must be greater than 0'),
    });

    type MintForm = yup.InferType<typeof mintSchema>;

    const resolver = yupResolver(mintSchema);
    const { register, handleSubmit, formState: { errors } } = useForm<MintForm>({
        resolver,
        defaultValues: {
            amount: 100.0
        }
    });

    const [token, setToken] = useState<Token>(TOKENS[chain.id][0]);

    const { data: balance } = useBalance({
        address: account.address,
        token: token.address,
        watch: true
    });

    const changeToken = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setToken(findToken(event.target.value, chain.id));
    };

    const [amountInWei, setAmountInWei] = useState<bigint>(BigInt(0));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { config } = usePrepareContractWrite({
        enabled: amountInWei > 0,
        address: token.address,
        abi: mintableTokenABI,
        functionName: 'mint',
        args: [amountInWei]
    });

    const { data, status, error: mintError, write: mint } = useContractWrite(config);
    useEffect(() => mint?.(), [mint]);

    useWaitForTransaction({ hash: data?.hash });
    useEffect(() => {
        if (data?.hash) {
            setBusy(false);
            setAmountInWei(BigInt(0));
        }
    }, [data]);

    useEffect(() => {
        if (mintError) {
            setError(formatError(mintError));
            setAmountInWei(BigInt(0));
            setBusy(false);
        }
    }, [mintError]);

    const onSubmit = handleSubmit((values) => {
        setError(null);
        setBusy(true);
        setAmountInWei(parseUnits(`${values.amount}`, token.decimals));
    });

    return (
        <div className="container">
            <div>Status: {status}</div>
            <div>Balance: {balance && balance.formatted}</div>
            <form onSubmit={onSubmit}>
                <div className="field">
                    <label className="label" htmlFor="amount">Amount</label>
                    <input className="input" type="number" step="any" {...register("amount")} />
                    <p className="help"><ErrorMessage errors={errors} name="amount" /></p>
                </div>

                <div className="field">
                    <div className="control">
                        <div className="select">
                            <select {...register("token")}
                                onChange={changeToken}>
                                {TOKENS[chain.id].map((token) => <option key={token.name} value={token.address}>{token.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <div className="control">
                        <button disabled={busy} className="button is-link">Mint Token</button>
                    </div>
                </div>
                {error && <pre>{error}</pre>}
            </form>
        </div>
    );
};
