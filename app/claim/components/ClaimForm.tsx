'use client';

import * as yup from 'yup';
import { parseUnits, formatUnits } from 'ethers/lib/utils';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useContractFunction, useEthers, useTokenBalance } from '@usedapp/core';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';

import { findToken, TOKENS } from '@/app/common';
import { ClaimableToken, ClaimableToken__factory } from '@/gen/types';
import { Token } from '@/app/models/Token';

export default function ClaimForm() {
    const { account, library } = useEthers();

    const claimSchema = yup.object({
        token: yup.string().required(),
        amount: yup.number()
            .typeError('amount is required')
            .required()
            .positive('amount must be greater than 0'),
    });

    type ClaimForm = yup.InferType<typeof claimSchema>;

    const getTokenContract = useCallback((address: string) => {
        return ClaimableToken__factory.connect(address, library!);
    }, [library]);

    const resolver = yupResolver(claimSchema);
    const { register, handleSubmit, formState: { errors } } = useForm<ClaimForm>({
        resolver,
        defaultValues: {
            amount: 100.0
        }
    });

    const chainId = library?.network?.chainId ?? 0;

    const [token, setToken] = useState<Token>(TOKENS[chainId][0]);
    const [contract, setContract] = useState<ClaimableToken>(getTokenContract(token.address));

    const { state, send } = useContractFunction(contract, 'claim', {
        transactionName: 'claim'
    });

    const { status, errorMessage } = state;

    const balance = useTokenBalance(token.address, account);

    const changeToken = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setToken(findToken(event.target.value, chainId));
    };

    useEffect(() => {
        setContract(getTokenContract(token.address));
    }, [token, getTokenContract]);

    const onSubmit = handleSubmit(async (values) => {
        const _token = findToken(values.token, chainId);
        await send(parseUnits(values.amount.toString(), _token.decimals));
    });

    return (
        <div className="container">
            <div>Status: {status} - {errorMessage}</div>
            <div>Balance: {balance && formatUnits(balance, token.decimals)}</div>
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
                                {TOKENS[chainId].map((token) => <option key={token.name} value={token.address}>{token.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <div className="control">
                        <button className="button is-link">Claim</button>
                    </div>
                </div>
            </form>
        </div>
    );
};
