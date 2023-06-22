import UseNetworkWrapper from '@/app/components/UseNetworkWrapper';
import DisplayCampaign from '../components/DisplayCampaign';

export const metadata = {
    title: 'ChainRaise: Funding Campaign',
};

export default function Fund({ params: { id } }: { params: { id: bigint; }; }) {
    return (
        <main className="main">
            <UseNetworkWrapper>
                <DisplayCampaign campaignId={id} />
            </UseNetworkWrapper>
        </main>
    );
}
