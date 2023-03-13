import UseEthersWrapper from '@/app/components/UseEthersWrapper';
import Campaign from '../components/Campaign';

export const metadata = {
    title: 'ChainRaise: Funding Campaign',
};

export default function Fund({ params: { id } }: { params: { id: string; }; }) {
    return (
        <main className="main">
            <UseEthersWrapper>
                <Campaign campaignId={id} />
            </UseEthersWrapper>
        </main>
    );
}
