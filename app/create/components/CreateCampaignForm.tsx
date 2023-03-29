'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useContractFunction, useEthers } from '@usedapp/core';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';

import { TOKENS } from '@/app/common';
import { Campaign, campaignSchema } from '@/app/models/Campaign';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';

import type { CampaignForm } from '@/app/models/Campaign';
import { useEffect } from 'react';

export default function CreateCampaignForm() {
    const { library } = useEthers();

    const router = useRouter();
    const resolver = yupResolver(campaignSchema);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CampaignForm>({
        resolver,
        defaultValues: {
            amount: 1,
            expiration: dayjs.utc().add(1, 'hour').local().format('YYYY-MM-DDTHH:mm')
        }
    });

    const chainRaise = getChainRaiseContract(library!);

    const { state, send, events } = useContractFunction(chainRaise, 'createCampaign', {
        transactionName: 'createCampaign'
    });

    const { status, errorMessage } = state;

    const chainId = library?.network?.chainId ?? 0;

    const onSubmit = handleSubmit((values) => {
        const campaign = new Campaign(values, chainId);
        return send(campaign.token.address, campaign.amount, campaign.expiration, '');
    });

    useEffect(() => {
        if (events) {
            const { campaignId } = events.at(-1)!.args;
            router.push(`/fund/${campaignId}`);
        }
    }, [router, events]);

    return (
        <div className="container">
            <div>Status: {status}{errorMessage && ` - ${errorMessage}`}</div>
            <form onSubmit={onSubmit}>
                <div className="field">
                    <label className="label" htmlFor="title">Title</label>
                    <input className="input" type="text" {...register("title")} />
                    <p className="help"><ErrorMessage errors={errors} name="title" /></p>
                </div>

                <div className="field">
                    <label className="label" htmlFor="description">Description</label>
                    <div className="control">
                        <textarea className="textarea" {...register("description", {})} />
                    </div>
                </div>

                <div className="field">
                    <label className="label" htmlFor="amount">Amount</label>
                    <input className="input" type="number" step="any" {...register("amount")} />
                    <p className="help"><ErrorMessage errors={errors} name="amount" /></p>
                </div>

                <div className="field">
                    <div className="control">
                        <div className="select">
                            <select {...register("token")}>
                                {TOKENS[chainId].map((token) => <option key={token.name} value={token.address}>{token.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <div className="control">
                        <label className="label" htmlFor="expiration">Expiration</label>
                        <input className="input" type="datetime-local" {...register("expiration", { valueAsDate: true })} />
                        <p className="help"><ErrorMessage errors={errors} name="expiration" /></p>
                    </div>
                </div>

                <div className="field">
                    <div className="control">
                        <button disabled={isSubmitting} className="button is-link">Submit</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
