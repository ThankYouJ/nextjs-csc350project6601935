'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-connect if the user already authorized this site in MetaMask
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.ethereum) return;

    const eth = window.ethereum;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const normalized = ethers.getAddress(accounts[0]);
        setAddress(normalized);
        setProvider(new ethers.BrowserProvider(eth));
        localStorage.setItem('walletConnected', 'true');
      } else {
        setAddress(null);
        setProvider(null);
        localStorage.removeItem('walletConnected');
      }
    };

    // On first load, check if MetaMask already has an account connected
    eth.request({ method: 'eth_accounts' })
      .then(handleAccountsChanged)
      .catch(() => {});

    // Listen for account changes
    eth.on('accountsChanged', handleAccountsChanged);

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask not found. Please install MetaMask.');
      return;
    }

    try {
      setIsConnecting(true);
      const eth = window.ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        const normalized = ethers.getAddress(accounts[0]);
        setAddress(normalized);
        setProvider(new ethers.BrowserProvider(eth));
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // You can't force-disconnect in MetaMask, but you can clear your app state
    setAddress(null);
    setProvider(null);
    localStorage.removeItem('walletConnected');
  };

  const value = {
    address,
    provider,
    isConnecting,
    isConnected: !!address,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used inside <WalletProvider>');
  }
  return ctx;
}