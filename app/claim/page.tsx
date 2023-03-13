import UseEthersWrapper from '@/app/components/UseEthersWrapper';
import ClaimForm from './components/ClaimForm';

export const metadata = {
    title: 'ChainRaise: Claim test tokens',
};

export default function Claim() {
    return (
        <main className="main">
            <UseEthersWrapper>
                <ClaimForm />
            </UseEthersWrapper>
        </main>
    );
}
