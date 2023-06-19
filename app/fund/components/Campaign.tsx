'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(localizedFormat);

import { useCallback, useEffect, useState } from 'react';
import { useContractRead, useEnsName, useNetwork, usePublicClient } from 'wagmi';
import { decodeAbiParameters, formatUnits, parseAbiItem, parseAbiParameters, sliceHex } from 'viem';

import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { findToken } from '@/app/common';
import { toHTML } from '@/app/utils';

import FundForm from './FundForm';
import { MarkDown } from '@/gen/app/models/markdown';

export default function Campaign({ campaignId }: { campaignId: string; }) {
    const chain = useNetwork().chain!;
    const chainRaise = getChainRaiseContract();
    const publicClient = usePublicClient();

    const { data: campaign, error } = useContractRead({
        address: chainRaise.address,
        abi: chainRaise.abi,
        functionName: 'getCampaign',
        args: [BigInt(campaignId)],
        watch: true
    });

    useEffect(() => {
        const getFliterLogs = async () => {
            const filter = await publicClient.createContractEventFilter({
                address: chainRaise.address,
                abi: chainRaise.abi,
                eventName: 'CampaignCreated',
                fromBlock: 'earliest',
                args: {
                    campaignId: BigInt(campaignId)
                }
            });

            const logs = await publicClient.getFilterLogs({ filter });
            const tx = await publicClient.getTransaction({ hash: logs[0].transactionHash! });
            const abi = parseAbiParameters('address token, uint256 goal, uint256 deadline, bytes calldata description');
            const input = decodeAbiParameters(abi, `0x${tx.input.slice(10)}`);
            const markdown = MarkDown.decode(Buffer.from(input[3].slice(2), 'hex'));
            setDescription(await toHTML(markdown));
            return logs;
        };
        getFliterLogs().catch(console.error);
    }, [campaignId, chainRaise.abi, chainRaise.address, publicClient]);

    //const { data: ens } = useEnsName({ address: campaign?.creator });
    const ens = undefined;
    const [description, setDescription] = useState('');

    if (error) {
        return (<pre>Error {error.message}...</pre>);
    }

    if (!campaign) {
        return (<div>Loading...</div>);
    }

    const token = findToken(campaign.token, chain.id);
    const deadline = dayjs.unix(campaign.deadline).local().format('LLL');

    return (
        <div className="columns is-desktop">
            <div className="column">
                <table className="table is-narrow is-bordered is-hoverable">
                    <thead>
                        <tr><td>Campaign</td><td>{campaignId}</td></tr>
                    </thead>
                    <tbody>
                        <tr><td>Creator</td><td>{ens ?? campaign.creator}</td></tr>
                        <tr><td>Token</td><td>{token.name}</td></tr>
                        <tr><td>Goal</td><td>{formatUnits(campaign.goal, token.decimals)}</td></tr>
                        <tr><td>Raised</td><td>{formatUnits(campaign.raisedAmount, token.decimals)}</td></tr>
                        <tr><td>Deadline</td><td>{deadline}</td></tr>
                        <tr><td>Description</td><td dangerouslySetInnerHTML={{ __html: description }} /></tr>
                    </tbody>
                </table>
            </div>
            <div className="pt-3 column">
                <FundForm campaignId={campaignId} address={campaign.token} />
            </div>
        </div>
    );
}
