import { useEthers } from '@usedapp/core';

export default function ConnectButton() {
    const { isLoading, account, deactivate, activateBrowserWallet } = useEthers();

    if (isLoading) {
        return (<div>Loading...</div>);
    }

    if (account) {
        return (<button className="button is-primary" onClick={deactivate}>Disconnect</button>);
    }

    return (<button className="button is-primary" onClick={activateBrowserWallet}>Connect</button>);
}
