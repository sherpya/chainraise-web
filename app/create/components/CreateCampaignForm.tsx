'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Modal from 'react-modal';
import { decodeEventLog } from 'viem';
import { useContractWrite, useNetwork, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';

import { TOKENS, formatError } from '@/app/common';
import { Campaign, campaignSchema } from '@/app/models/Campaign';
import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { toMessage } from '@/app/utils';


export default function CreateCampaignForm() {
    const chain = useNetwork().chain!;

    const router = useRouter();
    const resolver = yupResolver(campaignSchema);
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver,
        defaultValues: {
            amount: 1,
            expiration: dayjs.utc().add(1, 'day').local().format('YYYY-MM-DDTHH:mm')
        }
    });

    const chainRaise = getChainRaiseContract();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const customStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
        },
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)'
        }
    };

    const { config } = usePrepareContractWrite({
        cacheTime: 0, // avoid: DOMException: The quota has been exceeded.
        enabled: campaign != null,
        address: chainRaise.address,
        abi: chainRaise.abi,
        functionName: 'createCampaign',
        args: campaign?.toArgs()
    });

    const { data, write: createCampaign, error: createCampaignError } = useContractWrite(config);

    const { data: tx } = useWaitForTransaction({
        hash: data?.hash
    });

    useEffect(() => {
        if (!tx || !tx.logs.at(-1)) {
            return;
        }
        const log = tx.logs.at(-1)!;
        const event = decodeEventLog({
            abi: chainRaise.abi,
            data: log.data,
            eventName: 'CampaignCreated',
            topics: log.topics
        });
        const { campaignId } = event.args;
        router.push(`/campaign/${campaignId}`);
    }, [chainRaise.abi, router, tx]);

    useEffect(() => {
        if (createCampaignError) {
            setError(formatError(createCampaignError));
            setCampaign(null);
            setBusy(false);
        }
    }, [createCampaignError]);

    const onSubmit = handleSubmit(async (values) => {
        const message = toMessage(values.title, values.description);
        const campaign = Campaign.fromForm(values, chain.id, message);
        setError(null);
        setBusy(true);
        setCampaign(campaign);
    });

    useEffect(() => {
        if (campaign) {
            if (campaign.isOversided()) {
                setShowModal(true);
            } else {
                createCampaign?.();
            }
        }
    }, [campaign, createCampaign]);

    useEffect(() => {
        Modal.setAppElement('body');
    }, []);

    const afterOpenModal = () => {
        setCampaign(null);
        setBusy(false);
    };

    return (
        <div className="container">
            <form onSubmit={onSubmit}>
                <div className="field">
                    <label className="label" htmlFor="title">Title</label>
                    <input className="input" type="text" {...register("title")} />
                    <p className="help"><ErrorMessage errors={errors} name="title" /></p>
                </div>

                <div className="field">
                    <label className="label" htmlFor="description">Description</label>
                    <div className="control">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <ReactQuill {...field} theme="snow"
                                    onChange={(text) => field.onChange(text)}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'image']
                                        ]
                                    }} />
                            )}
                        />
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
                                {TOKENS[chain.id].map((token) => <option key={token.name} value={token.address}>{token.name}</option>)}
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
                        <button disabled={busy} className="button is-link">Submit</button>
                    </div>
                </div>
            </form>

            <Modal isOpen={showModal} onAfterOpen={afterOpenModal} onRequestClose={() => setShowModal(false)} style={customStyles}>
                <h1 className="pb-3">The description is oversized, try to use smaller images.</h1>
                <div className="buttons is-right">
                    <button className="button is-link is-right is-danger" onClick={() => setShowModal(false)}>OK</button>
                </div>
            </Modal>

            {error && <pre>{error}</pre>}
        </div>
    );
}
