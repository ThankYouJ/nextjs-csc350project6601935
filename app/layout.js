'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WalletProvider } from './WalletProvider';
import ConnectWalletButton from './components/ConnectWalletButton';
// ^ make sure WalletProvider.jsx is in the same folder as layout.js

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <header
            style={{
              backgroundColor: '#ffffff',
              padding: '1rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 1000,
            }}
          >
            <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>
              <h2
                style={{
                  margin: 0,
                  cursor: 'pointer',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                My Restaurant
              </h2>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* put your ConnectWalletButton here if you want it in the header */}
              {/* <ConnectWalletButton /> */}

              {!user && (
                <>
                  <Link
                    href="/sign-in"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    Sign-in
                  </Link>
                  <Link
                    href="/sign-up"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    Sign-up
                  </Link>
                </>
              )}

              {user && (
                <>
                  <Link
                    href="/orders"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    Orders
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                    href="/admin"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                    >
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    {user.fname || 'Profile'}
                  </Link>
                  <ConnectWalletButton />
                  <button
                    className="button-danger"
                    onClick={handleSignOut}
                    style={{
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Sign-out
                  </button>
                </>
              )}
            </nav>
          </header>

          <main style={{ padding: '2rem' }}>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}