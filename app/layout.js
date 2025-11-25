'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WalletProvider } from './WalletProvider';
import ConnectWalletButton from './components/ConnectWalletButton';

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
                RSU Reward
              </h2>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

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

                  <Link
                    href="/promotions"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    Coupons
                  </Link>

                  <Link
                    href="/instruction"
                    style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                  >
                    Add Token
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}
                    >
                      Admin Panel
                    </Link>
                  )}

                  {user && user.role === "merchant" && (
                    <Link href="/merchant"
                      style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                      Merchant Panel
                    </Link>
                  )}

                  <ConnectWalletButton />
                  <Link
                    href="/profile"
                    style={{
                      backgroundColor: '#007bff',
                      textAlign: 'center',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0056b3';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#007bff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {user.fname || 'Profile'}
                  </Link>
                  <button
                    className="button-danger"
                    onClick={handleSignOut}
                    style={{
                      backgroundColor: 'red',
                      textAlign: 'center',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(212, 68, 68, 0.5)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(224, 0, 0, 1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 68, 68, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'red';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 68, 68, 0.5)';
                      e.currentTarget.style.transform = 'translateY(0)';
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