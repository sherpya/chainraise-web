import * as yup from 'yup';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { Address, Hex, toHex, zeroAddress } from 'viem';
import { formatUnits as fu, parseUnits as pu } from 'viem';

import { Token } from './Token';
import { TOKENS } from '../common';


export const campaignSchema = yup.object({
    title: yup.string().required('title is required')
        .test('not-empty', 'title is required',
            function (value) {
                return value.trim().length > 0;
            }),
    description: yup.string(),
    token: yup.string().required(),
    amount: yup.number()
        .typeError('amount is required')
        .required()
        .positive('amount must be greater than 0'),
    expiration: yup.string().required()
        .test('date-in-the-future', 'expiration must be at least 1 hour in the future',
            function (value) {
                const date = dayjs(value!).utc();
                const now = dayjs().utc().add(50, 'minutes');
                return !date.isBefore(now);
            })
});

export type CampaignForm = yup.InferType<typeof campaignSchema>;

export class Campaign {
    constructor(
        public chainId: number,
        public campaignId: bigint = BigInt(0),
        public title: string,
        public creator: Address = zeroAddress,
        public deadline: number,
        public token: Token,
        public goal: bigint,
        public closed: boolean = false,
        public raisedAmount: bigint = BigInt(0),
        public blob: Uint8Array = new Uint8Array(),
    ) {
        this.chainId = chainId;
        this.campaignId = campaignId;
        this.title = title;
        this.creator = creator;
        this.blob = blob;
        this.deadline = deadline;
        this.token = token;
        this.goal = goal;
        this.blob = blob;
        this.raisedAmount = raisedAmount;
        this.closed = closed;

    }

    static fromForm(
        campaign: CampaignForm,
        chainId: number,
        blob?: Uint8Array) {

        const title = campaign.title.trim();
        const deadline = dayjs(campaign.expiration).utc().unix();
        const token = TOKENS[chainId].find(token => token.address === campaign.token);
        if (!token) {
            throw new Error('Unsupported Token');
        }
        const amount = pu(`${campaign.amount}`, token.decimals);

        return new Campaign(chainId, undefined, title, undefined, deadline, token, amount, false, undefined, blob);
    }

    static fromChain({
        chainId,
        campaignId,
        creator,
        token,
        deadline,
        closed,
        goal,
        raisedAmount }: {
            chainId: number,
            campaignId: bigint,
            creator: Address,
            token: Address,
            deadline: number,
            closed: boolean,
            goal: bigint,
            raisedAmount: bigint;
        }) {
        const _token = TOKENS[chainId].find(t => t.address === token);
        if (!_token) {
            throw new Error('Unsupported Token');
        }
        return new Campaign(chainId, campaignId, 'title', creator, deadline, _token, goal, closed, raisedAmount);
    }

    formatUnits(value: bigint) {
        return fu(value, this.token.decimals);
    }

    parseUnits(value: number) {
        return pu(`${value}`, this.token.decimals);
    }

    toArgs(): [Address, bigint, bigint, Hex] {
        return [
            this.token.address,
            this.goal,
            BigInt(this.deadline),
            toHex(this.blob || new Uint8Array())
        ];
    }
}
