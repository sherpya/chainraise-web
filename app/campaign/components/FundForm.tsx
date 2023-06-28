import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import * as yup from 'yup';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BallTriangle } from 'react-loader-spinner';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';
import { erc20ABI, useAccount, useBalance, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi';

import { formatError } from '@/app/common';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { useAllowance } from '@/src/wagmi/hooks/useAllowance';
import { Campaign } from '@/app/models/Campaign';

enum FundState {
    Idle,
    Busy,
    Approved
};

export default function FundForm({ campaign }: { campaign: Campaign; }) {
    const account = useAccount();
    const [status, setStatus] = useState<FundState>(FundState.Idle);

    const fundSchema = yup.object({
        amount: yup.number()
            .typeError('amount is required')
            .required()
            .positive('amount must be greater than 0')
    });

    // FIXME: reject on fund changes the button to approve

    const isExpired = dayjs.utc().unix() > campaign.deadline;
    const defaultAmount = 1.0;
    const defaultAmountUnits = campaign.parseUnits(defaultAmount);

    const resolver = yupResolver(fundSchema);
    const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
        resolver,
        defaultValues: {
            amount: defaultAmount
        }
    });

    const { data: balance } = useBalance({
        address: account.address,
        token: campaign.token.address,
        watch: true
    });

    const [error, setError] = useState<string | null>(null);
    const [disabled, setDisabled] = useState(false);

    const chainRaise = getChainRaiseContract();

    const { data: allowance } = useAllowance({
        owner: account.address,
        spender: chainRaise.address,
        token: campaign.token.address,
        watch: true
    });

    const [amount, setAmount] = useState(defaultAmountUnits);

    useEffect(() => {
        if (allowance !== undefined) {
            setStatus((allowance.value >= amount) ? FundState.Approved : FundState.Idle);
        }
    }, [allowance, amount]);

    /* approve */
    const { config: approveConfig }
        = usePrepareContractWrite({
            address: campaign.token.address,
            abi: erc20ABI,
            functionName: 'approve',
            args: [chainRaise.address, amount],
        });
    const { error: approveError, write: approve }
        = useContractWrite(approveConfig);

    useEffect(() => {
        if (approveError) {
            setError(formatError(approveError));
            setStatus(FundState.Idle);
        }
    }, [approveError]);

    /* fund */
    const { config: fundConfig }
        = usePrepareContractWrite({
            enabled: status === FundState.Approved,
            address: chainRaise.address,
            abi: chainRaise.abi,
            functionName: 'fund',
            args: [campaign.campaignId, amount]
        });
    const { data: fundData, error: fundError, write: fund }
        = useContractWrite(fundConfig);
    useEffect(() => {
        if (fundError) {
            setError(formatError(fundError));
            setStatus(FundState.Idle);
        }
    }, [fundError]);

    const { data } = useWaitForTransaction({ hash: fundData?.hash });
    useEffect(() => {
        if (data) {
            resetForm();
            setAmount(defaultAmountUnits);
            setDisabled(false);
            setStatus(FundState.Idle);
        }
    }, [data, resetForm, defaultAmountUnits]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.value.length) {
            return;
        }
        try {
            const parsedAmount = campaign.parseUnits(parseFloat(event.target.value));
            setAmount(parsedAmount);
        } catch (error) {
            event.target.value = campaign.formatUnits(amount);
        }
    };

    useEffect(() => {
        setDisabled(isExpired || !balance || balance.value < amount);
    }, [balance, amount, isExpired]);

    const onSubmit = handleSubmit((values) => {
        setError(null);
        setAmount(campaign.parseUnits(values.amount));
        (status === FundState.Approved) ? fund?.() : approve?.();
        setStatus(FundState.Busy);
    });

    const ButtonLabel = isExpired ? 'Expired'
        : `${(status === FundState.Approved)
        && 'Fund' || 'Approve'} ${campaign.formatUnits(amount)} ${campaign.token.name}`;

    const Submit = () => {
        if (status === FundState.Busy) {
            return (
                <BallTriangle
                    height={100}
                    width={100}
                    radius={5}
                    color="#485fc7"
                    ariaLabel="ball-triangle-loading"
                    visible={true} />
            );
        } else {
            return (
                <button disabled={disabled} className="button is-link">
                    {ButtonLabel}
                </button>
            );
        }
    };

    return (
        <div className="container">
            <div>Status: {status}</div>
            <div>Balance: {balance && balance.formatted} -
                Allowance: {allowance && allowance.formatted} -
                Amount: {campaign.formatUnits(amount)}</div>
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
                        <Submit />
                    </div>
                </div>
            </form>
            {error && <pre>{error}</pre>}
        </div>
    );
};
