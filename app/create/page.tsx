import UseEthersWrapper from '../components/UseEthersWrapper';
import CreateCampaignForm from './components/CreateCampaignForm';

export const metadata = {
    title: 'ChainRaise: Create Campaign',
}

export default function Create() {
    return (
        <main className="main">
            <UseEthersWrapper>
                <CreateCampaignForm />
            </UseEthersWrapper>
        </main>
    )
}
