import UseNetworkWrapper from '@/app/components/UseNetworkWrapper';
import MintForm from './components/MintForm';

export const metadata = {
    title: 'ChainRaise: Mint test tokens',
};

export default function Mint() {
    return (
        <main className="main">
            <UseNetworkWrapper>
                <MintForm />
            </UseNetworkWrapper>
        </main>
    );
}
