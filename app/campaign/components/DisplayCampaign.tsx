'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(localizedFormat);

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { mainnet, useContractRead, useEnsAvatar, useEnsName, useNetwork, usePublicClient } from 'wagmi';
import { decodeAbiParameters, parseAbiParameters, sliceHex } from 'viem';

import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { fromMessage } from '@/app/utils';

import FundForm from './FundForm';
import WithdrawForm from './WithdrawForm';
import { MarkDown } from '@/gen/app/models/markdown';
import { Campaign } from '@/app/models/Campaign';

export default function DisplayCampaign({ campaignId }: { campaignId: bigint; }) {
    const chain = useNetwork().chain!;
    const chainRaise = getChainRaiseContract();
    const publicClient = usePublicClient();
    const [campaign, setCampaign] = useState<Campaign | undefined>();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const { data, error } = useContractRead({
        address: chainRaise.address,
        abi: chainRaise.abi,
        functionName: 'getCampaign',
        args: [campaignId],
        watch: true
    });

    useEffect(() => {
        if (data) {
            setCampaign(Campaign.fromChain({ chainId: chain.id, campaignId, ...data }));
        }
    }, [campaignId, chain.id, data]);

    useEffect(() => {
        const getFliterLogs = async () => {
            const filter = await publicClient.createContractEventFilter({
                address: chainRaise.address,
                abi: chainRaise.abi,
                eventName: 'CampaignCreated',
                fromBlock: 'earliest',
                args: {
                    campaignId: campaignId
                }
            });

            const logs = await publicClient.getFilterLogs({ filter });
            const tx = await publicClient.getTransaction({ hash: logs[0].transactionHash! });
            const abi = parseAbiParameters('address token, uint256 goal, uint256 deadline, bytes calldata description');
            const input = decodeAbiParameters(abi, sliceHex(tx.input, 4));
            const markdown = MarkDown.decode(Buffer.from(input[3].slice(2), 'hex'));
            const { title: _title, body } = await fromMessage(markdown);
            setTitle(_title);
            setDescription(body);
            return logs;
        };
        getFliterLogs().catch(console.error);
    }, [campaignId, chainRaise.abi, chainRaise.address, publicClient]);

    const { data: ens } = useEnsName({ address: campaign?.creator, enabled: !!campaign?.creator, chainId: mainnet.id });
    const { data: ensAvatar } = useEnsAvatar({ name: ens, chainId: mainnet.id });

    if (error) {
        return (<pre>Error {error.message}...</pre>);
    }

    if (!campaign) {
        return (<div>Loading...</div>);
    }

    const Avatar = () => {
        return (
            <div style={{ borderRadius: '32px', overflow: 'hidden', width: '64px', height: '64px' }}>
                {ensAvatar &&
                    <Image
                        src={ensAvatar}
                        width={64}
                        height={64}
                        alt={ens || campaign.creator} />
                }
            </div>
        );
    };

    return (
        <div className="columns is-desktop">
            <div className="column">
                <table className="table is-narrow is-bordered is-hoverable">
                    <thead>
                        <tr><td>Campaign</td><td>{title}</td></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Creator</td>
                            <td>
                                <div className="p-4 columns is-vcentered">
                                    <Avatar />
                                    <div className="p-2">{ens || campaign.creator}</div>
                                </div>
                            </td>
                        </tr>
                        <tr><td>Token</td><td>{campaign.token.name}</td></tr>
                        <tr><td>Goal</td><td>{campaign.formatUnits(campaign.goal)}</td></tr>
                        <tr><td>Raised</td><td>{campaign.formatUnits(campaign.raisedAmount)}</td></tr>
                        <tr><td>Deadline</td><td>{dayjs.unix(campaign.deadline).local().format('LLL')}</td></tr>
                        <tr><td>Description</td><td dangerouslySetInnerHTML={{ __html: description }} /></tr>
                    </tbody>
                </table>
            </div>
            <div className="pt-3 column">
                <FundForm campaign={campaign} />
            </div>
            <div className="pt-3 column">
                <WithdrawForm campaign={campaign} />
            </div>
        </div>
    );
}
