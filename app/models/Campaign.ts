import * as yup from 'yup';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { Address, Hex, parseUnits, toHex } from 'viem';

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
    public chainId: number;
    public title: string;
    public description?: Uint8Array;
    public expiration: bigint;
    public token: Token;
    public amount: bigint;

    constructor(campaign: CampaignForm, chainId: number, description?: Uint8Array) {
        this.chainId = chainId;
        this.title = campaign.title.trim();
        this.description = description;
        this.token = TOKENS[chainId].find(token => token.address === campaign.token)!;
        this.amount = parseUnits(`${campaign.amount}`, this.token.decimals);
        this.expiration = BigInt(dayjs(campaign.expiration).utc().unix());
    }

    toArgs(): [Address, bigint, bigint, Hex] {
        return [
            this.token.address,
            this.amount,
            this.expiration,
            toHex(this.description || new Uint8Array())
        ];
    }
}
