import UseNetworkWrapper from '@/app/components/UseNetworkWrapper';
import Campaign from '../components/Campaign';

export const metadata = {
    title: 'ChainRaise: Funding Campaign',
};

export default function Fund({ params: { id } }: { params: { id: bigint; }; }) {
    return (
        <main className="main">
            <UseNetworkWrapper>
                <Campaign campaignId={id} />
            </UseNetworkWrapper>
        </main>
    );
}
