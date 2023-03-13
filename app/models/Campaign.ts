import * as yup from 'yup';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

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
    public description?: string;
    public expiration: number;
    public token: Token;
    public amount: BigNumber;

    constructor(campaign: CampaignForm, chainId: number) {
        this.chainId = chainId;
        this.title = campaign.title.trim();
        this.description = campaign.description?.trim();
        this.token = TOKENS[chainId].find(token => token.address === campaign.token)!;
        this.amount = parseUnits(campaign.amount.toString(), this.token.decimals);
        this.expiration = dayjs(campaign.expiration).utc().unix();
    }
}
