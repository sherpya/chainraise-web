'use client';

import * as yup from 'yup';
import { parseUnits, formatUnits } from 'ethers/lib/utils';

import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEthers, useContractFunction, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';

import { findToken } from '@/app/common';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { ClaimableToken__factory } from '@/gen/types';

export default function FundForm({ campaignId, address }: { campaignId: string, address: string; }) {
    const { account, chainId, library } = useEthers();

    const fundSchema = yup.object({
        amount: yup.number()
            .typeError('amount is required')
            .required()
            .positive('amount must be greater than 0'),
    });

    type FundForm = yup.InferType<typeof fundSchema>;

    const resolver = yupResolver(fundSchema);
    const { register, handleSubmit, formState: { errors } } = useForm<FundForm>({
        resolver,
        defaultValues: {
            amount: 1.0
        }
    });

    const token = findToken(address, chainId!);
    const chainRaise = getChainRaiseContract(library!);
    const tokenContract = ClaimableToken__factory.connect(token.address, library!);

    const { state: state_fund, send: fund } = useContractFunction(chainRaise, 'fund', {
        transactionName: 'fund'
    });

    const { state: state_approve, send: approve } = useContractFunction(tokenContract, 'approve', {
        transactionName: 'approve'
    });

    const balance = useTokenBalance(token.address, account);
    const allowance = useTokenAllowance(token.address, account, chainRaise.address);
    const [amount, setAmount] = useState(parseUnits('1.0', token.decimals));

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.value !== '') {
            setAmount(parseUnits(event.target.value, token.decimals));
        }
    };

    const [disabled, setDisabled] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setDisabled(balance?.lt(amount) ?? true);
    }, [balance, amount]);

    useEffect(() => {
        setBusy(false);
    }, [balance, allowance]);

    useEffect(() => {
        if (state_fund.errorMessage !== undefined || state_approve.errorMessage !== undefined) {
            setBusy(false);
        }
    }, [state_fund, state_approve]);

    const onSubmit = handleSubmit(async (values) => {
        const _amount = parseUnits(values.amount.toString(), token.decimals);
        setAmount(_amount);
        setBusy(true);

        if (canFund) {
            await fund(campaignId, _amount);
        } else {
            await approve(chainRaise.address, _amount);
        }
    });

    const canFund = allowance && !allowance.isZero() && !amount.isZero() && allowance.gte(amount);
    const { status, errorMessage } = canFund ? state_fund : state_approve;

    return (
        <div className="container">
            <div>Status: {status}{errorMessage && ` - ${errorMessage}`}</div>
            <div>Balance: {balance && formatUnits(balance, token.decimals)} -
                Allowance: {allowance && formatUnits(allowance, token.decimals)}</div>
            <form onSubmit={onSubmit}>
                <div className="field">
                    <label className="label" htmlFor="amount">Amount</label>
                    <input className="input" type="number" step="any"
                        {...register("amount")}
                        onChange={onChange} />
                    <p className="help"><ErrorMessage errors={errors} name="amount" /></p>
                </div>

                <div className="field">
                    <div className="control">
                        <button disabled={disabled || busy} className="button is-link">
                            {canFund && 'Fund' || 'Approve'} {formatUnits(amount, token.decimals)} {token.name}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
