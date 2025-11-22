'use client';

import { useEffect, useState } from 'react';

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

const TOKEN_CONFIG = {
    address: '0xC4B281E8C5A9833e2f5C7AA638E54B1af6AC27f5',
    symbol: 'RTK',
    decimals: 18,
    image: 'https://library.rsu.ac.th/img/rsu_p.png',
};

export default function WalletInstruction() {
    const [walletAddress, setWalletAddress] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            window.location.href = '/';
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
    }, []);

    const handleAddTokenToMetaMask = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('กรุณาติดตั้ง MetaMask หรือเปิดหน้านี้ในเบราว์เซอร์ที่รองรับ');
            return;
        }

        try {
            // 1) Switch to Sepolia first
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // 11155111 = Sepolia
                });
            } catch (switchError) {
                // If Sepolia is not added in MetaMask yet, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia',
                                nativeCurrency: {
                                    name: 'Sepolia ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrls: [SEPOLIA_RPC_URL],
                                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                            },
                        ],
                    });
                } else {
                    throw switchError;
                }
            }

            // 2) Now add the token on the **current** (Sepolia) network
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: TOKEN_CONFIG.address,
                        symbol: TOKEN_CONFIG.symbol,
                        decimals: TOKEN_CONFIG.decimals,
                        image: TOKEN_CONFIG.image,
                    },
                },
            });

            if (wasAdded) {
                alert('เพิ่มโทเคนของคุณบนเครือข่าย Sepolia สำเร็จ ✅');
            } else {
                alert('ผู้ใช้ยกเลิกการเพิ่มโทเคน ❌');
            }
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการเพิ่มโทเคน โปรดลองอีกครั้ง');
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                วิธีการเพิ่ม RSUToken ในกระเป๋าเงินดิจิทัล (MetaMask)
            </h1>

            <ol style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                <li>ติดตั้งส่วนขยาย <a href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en" target='_blank'>MetaMask</a> บนเบราว์เซอร์ (Chrome, Firefox ฯลฯ)</li>
                <li>สร้างกระเป๋าเงินใหม่ หรือเข้าสู่ระบบด้วยกระเป๋าเงินที่มีอยู่แล้ว</li>
                <li>เข้าไปที่ <b>Settings &gt; Advanced &gt; Show test networks </b>เลือกเป็น <b>ON</b> </li>
                <li>จากนั้นคลิกปุ่มด้านล่างเพื่อให้ระบบเพิ่มโทเคน RSUToken เข้าไปใน MetaMask โดยอัตโนมัติ</li>
            </ol>

            <button
                onClick={handleAddTokenToMetaMask}
                style={{
                    padding: '0.8rem 1.8rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(90deg, #4A56E2, #6F4AE2)',
                    color: '#fff',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(80,80,255,0.3)',
                    marginBottom: '2rem',
                }}
            >
                เพิ่ม RSUToken ลงใน MetaMask
            </button>

            <div style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <video
                    src="/videos/sepolia-tutorial.mp4"
                    poster="/videos/sepolia-poster.png"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '50%', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', pointerEvents: 'none' }}
                />

                <p style={{ fontSize: '0.95rem', color: '#555', marginTop: '1rem' }}>
                    เมื่อเพิ่มโทเคนสำเร็จ คุณจะเห็น RSUToken ในรายการโทเคนของคุณบนเครือข่าย Sepolia
                </p>
            </div>

            <hr style={{ margin: '2rem 0' }} />

            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>เพิ่มโทเคนแบบแมนนวล (สำรอง)</h2>
            <p style={{ marginBottom: '0.5rem' }}>
                หากปุ่มด้านบนมีปัญหา คุณยังสามารถเพิ่มโทเคนด้วยตนเองได้โดย:
            </p>
            <ol style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                <li>ทำตามขั้นตอนที่ 3. ด้านบน</li>
                <li>กด จุดสามจุด &gt; คลิกปุ่ม <strong>Import tokens</strong></li>
                <li>เลือกแท็บ <strong>Custom token</strong></li>
                <li>กรอก <strong>Token Contract Address</strong>: <code>{TOKEN_CONFIG.address}</code></li>
                <li>ตรวจสอบว่า <strong>Token Symbol</strong> เป็น: <code>{TOKEN_CONFIG.symbol}</code></li>
                <li>ตรวจสอบว่า <strong>Decimals</strong>: <code>{TOKEN_CONFIG.decimals}</code></li>
                <li>กด <strong>Next</strong> และ <strong>Import</strong></li>
            </ol>
        </div>
    );
}