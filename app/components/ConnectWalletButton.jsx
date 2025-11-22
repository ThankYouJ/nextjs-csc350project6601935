'use client';

import { useWallet } from '../WalletProvider';

export default function ConnectWalletButton() {
    const { address, isConnecting, connect, disconnect, isConnected } = useWallet();

    if (isConnected) {
        const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
        return (
            <button
                onClick={disconnect}
                style={{
                    backgroundColor: '#ddd',
                    color: '#333',
                    fontWeight: '600',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: '0.2s',
                }}
            >
                {short} (Disconnect)
            </button>
        );
    }

    return (
        <button
            onClick={connect}
            disabled={isConnecting}
            style={{
                backgroundColor: '#4A56E2',
                color: 'white',
                fontWeight: '600',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: '0.2s',
            }}
        >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
    );
}