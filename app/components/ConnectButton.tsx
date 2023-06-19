'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function ConnectButton() {
    const { isConnected } = useAccount();
    const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnected) {
        return (
            <div>
                <button className="button is-primary" onClick={() => disconnect()}>Disconnect</button>
            </div>
        );
    }

    return (
        <div>
            {connectors.map((connector) => (
                <button
                    className="button is-primary"
                    disabled={!connector.ready}
                    key={connector.id}
                    onClick={() => connect({ connector })}
                >
                    {connector.name}
                    {!connector.ready && ' (unsupported)'}
                    {isLoading &&
                        connector.id === pendingConnector?.id &&
                        ' (connecting)'}
                </button>
            ))}

            {error && <div>{error.message}</div>}
        </div>
    );
}
