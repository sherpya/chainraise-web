import UseNetworkWrapper from '../components/UseNetworkWrapper';
import CreateCampaignForm from './components/CreateCampaignForm';

export const metadata = {
    title: 'ChainRaise: Create Campaign',
}

export default function Create() {
    return (
        <main className="main">
            <UseNetworkWrapper>
                <CreateCampaignForm />
            </UseNetworkWrapper>
        </main>
    )
}
