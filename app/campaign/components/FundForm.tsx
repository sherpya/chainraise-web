import * as yup from 'yup';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';
import { erc20ABI, useAccount, useBalance, usePrepareContractWrite, useContractWrite, useNetwork, useWaitForTransaction } from 'wagmi';

import { formatError } from '@/app/common';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { useAllowance } from '@/src/wagmi/hooks/useAllowance';
import { Campaign } from '@/app/models/Campaign';

export default function FundForm({ campaign }: { campaign: Campaign; }) {
    const account = useAccount();

    const fundSchema = yup.object({
        amount: yup.number()
            .typeError('amount is required')
            .required()
            .positive('amount must be greater than 0')
    });

    // FIXME: check deadline

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

    const [disabled, setDisabled] = useState(false);
    const [busy, setBusy] = useState(false);

    const chainRaise = getChainRaiseContract();
    const [error, setError] = useState<string | null>(null);

    const { data: allowance } = useAllowance({
        owner: account.address,
        spender: chainRaise.address,
        token: campaign.token.address,
        watch: true
    });

    const [amount, setAmount] = useState(defaultAmountUnits);
    const [canFund, setCanFund] = useState(false);

    useEffect(() => {
        console.log(`${canFund} - ${campaign.formatUnits(amount)}`);
    }, [canFund, amount, campaign]);

    useEffect(() => {
        console.log(((allowance?.value ?? 0) >= amount));
        if ((allowance?.value ?? 0) >= amount) {
            setBusy(false);
            setCanFund(true);
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
    const { status: approveStatus, error: approveError, write: approve }
        = useContractWrite(approveConfig);
    useEffect(() => {
        if (approveError) {
            setError(formatError(approveError));
            setBusy(false);
        }
    }, [approveError]);

    /* fund */
    const { config: fundConfig }
        = usePrepareContractWrite({
            enabled: canFund,
            address: chainRaise.address,
            abi: chainRaise.abi,
            functionName: 'fund',
            args: [campaign.campaignId, amount]
        });
    const { data: fundData, status: fundStatus, error: fundError, write: fund }
        = useContractWrite(fundConfig);
    useEffect(() => {
        if (fundError) {
            setError(formatError(fundError));
            setBusy(false);
        }
    }, [fundError]);

    useWaitForTransaction({ hash: fundData?.hash });
    useEffect(() => {
        if (fundData?.hash) {
            resetForm();
            setCanFund(false);
            setAmount(defaultAmountUnits);
            setBusy(false);
            setDisabled(true);
        }
    }, [fundData, resetForm, defaultAmountUnits]);

    /* status */
    const [status, setStatus] = useState('');
    useEffect(() => setStatus(`approve: ${approveStatus}`), [approveStatus]);
    useEffect(() => setStatus(`fund: ${fundStatus}`), [fundStatus]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.value.length) {
            return;
        }
        try {
            const parsedAmount = campaign.parseUnits(parseFloat(event.target.value));
            setCanFund(false);
            setAmount(parsedAmount);
        } catch (error) {
            event.target.value = campaign.formatUnits(amount);
        }
    };

    useEffect(() => {
        setDisabled(!balance || balance.value < amount);
    }, [balance, amount]);

    const onSubmit = handleSubmit((values) => {
        setError(null);
        setBusy(true);
        setAmount(campaign.parseUnits(values.amount));
        canFund ? fund?.() : approve?.();
    });

    return (
        <div className="container">
            <div>Status: {status}</div>
            <div>Balance: {balance && balance.formatted} -
                Allowance: {allowance && allowance.formatted} -
                Amount: {campaign.formatUnits(amount)} -
                CanFund: {canFund && 'yes' || 'no'}</div>
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
                            {canFund && 'Fund' || 'Approve'} {campaign.formatUnits(amount)} {campaign.token.name}
                        </button>
                    </div>
                </div>
            </form>
            {error && <pre>{error}</pre>}
        </div>
    );
};
