'use client';

import { formatUnits } from 'ethers/lib/utils';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(localizedFormat);

import { useEthers, useCall, useLookupAddress } from '@usedapp/core';

import { getChainRaiseContract } from '@/app/contracts/ChainRaise';
import { findToken } from '@/app/common';

import FundForm from './FundForm';

export default function Campaign({ campaignId }: { campaignId: string; }) {
    const { chainId, library } = useEthers();
    const chainRaise = getChainRaiseContract(library!);

    const campaign = useCall({
        contract: chainRaise,
        method: 'campaigns',
        args: [campaignId]
    })?.value;

    const ens = useLookupAddress(campaign?.creator)?.ens;

    if (!campaign) {
        return (<div>Loading...</div>);
    }

    const token = findToken(campaign.token, chainId!);
    const deadline = dayjs.unix(campaign.deadline).local().format('LLL');

    return (
        <div className="container columns">
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
                        <tr><td>Metadata</td><td>{campaign.metadata}</td></tr>
                    </tbody>
                </table>
            </div>
            <div className="pt-3 column">
                <FundForm campaignId={campaignId} address={campaign.token} />
            </div>
        </div>
    );
}
