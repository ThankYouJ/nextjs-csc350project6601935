// app/promotions/page.js
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../WalletProvider';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contractConfig';

export default function PromotionPage() {
    const [user, setUser] = useState(null);
    const [userPromotions, setUserPromotions] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // from WalletProvider
    const { address, provider, isConnected, connect } = useWallet();

    // token balance state
    const [tokenBalance, setTokenBalance] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState('');

    // Load user from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            window.location.href = '/';
            return;
        }
        setUser(JSON.parse(stored));
    }, []);

    // Load user's redeemed promotions
    useEffect(() => {
        if (!user) return;

        const fetchUserPromos = async () => {
            try {
                const res = await fetch(`/api/users/promotions?user_id=${user.user_id || user.id}`);
                if (!res.ok) return;
                const data = await res.json();
                setUserPromotions(data);
            } catch (e) {
                console.error("Failed to fetch user promotions", e);
            }
        };

        fetchUserPromos();
    }, [user]);

    // Mark promotions as redeemed
    useEffect(() => {
        if (!promotions.length || !userPromotions.length) return;

        setPromotions(prev =>
            prev.map(p => {
                const already = userPromotions.some(up => up.promotion_id === p.promotion_id);
                return { ...p, _redeemed: already };
            })
        );
    }, [promotions.length, userPromotions.length]);


    // Load promotions
    useEffect(() => {
        if (!user) return;

        const fetchPromotions = async () => {
            setLoadingPromos(true);
            setError('');
            setMessage('');

            try {
                const res = await fetch('/api/promotions');
                if (!res.ok) throw new Error('Failed to load promotions');
                const data = await res.json();
                setPromotions(data);
            } catch (err) {
                setError(err.message || 'Error loading promotions');
            } finally {
                setLoadingPromos(false);
            }
        };

        fetchPromotions();
    }, [user]);

    // Fetch RSUToken balance from chain using WalletProvider
    useEffect(() => {
        if (!isConnected || !provider || !address) return;

        const fetchBalance = async () => {
            setLoadingBalance(true);
            setBalanceError('');

            try {
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const raw = await contract.balanceOf(address);
                // assuming RSUToken has 18 decimals
                const formatted = ethers.formatUnits(raw, 18);
                setTokenBalance(formatted); // string
            } catch (err) {
                console.error('Error fetching token balance:', err);
                setBalanceError('ไม่สามารถดึงยอด RSUToken ได้');
            } finally {
                setLoadingBalance(false);
            }
        };

        fetchBalance();
    }, [isConnected, provider, address]);

    // Redeem handler
    const handleRedeem = async (promotion) => {
        if (!user) return;

        const alreadyHave = userPromotions.some(
            (up) => up.promotion_id === promotion.promotion_id
        );
        if (alreadyHave) {
            setError('คุณมีโปรโมชั่นนี้อยู่แล้ว');
            return;
        }

        const userId = user.user_id || user.id;

        if (!isConnected || !provider || !address) {
            alert('กรุณาเชื่อมต่อ MetaMask ก่อนแลกโปรโมชั่น');
            return;
        }

        const confirmText = `ยืนยันแลกคูปองส่วนลด "${promotion.title}"\nใช้ ${promotion.token_cost} RSUToken ?`;
        if (!window.confirm(confirmText)) return;

        try {
            setRedeemingId(promotion.promotion_id);
            setError('');
            setMessage('');

            // 1) Blockchain: send RSUToken from user → ADMIN_WALLET
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const amount = ethers.parseUnits(
                promotion.token_cost.toString(),
                18
            );

            const tx = await contract.transfer(process.env.NEXT_PUBLIC_ADMIN_WALLET, amount);
            await tx.wait();

            // 2) Backend: record redemption in DB
            const res = await fetch('/api/promotions/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    promotion_id: promotion.promotion_id,
                    tx_hash: tx.hash,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Backend redeem failed');
            }

            setMessage(`แลกคูปองส่วนลด "${promotion.title}" สำเร็จ!`);
            setPromotions(prev =>
                prev.map(p =>
                    p.promotion_id === promotion.promotion_id
                        ? { ...p, _redeemed: true }
                        : p
                )
            );
        } catch (err) {
            console.error('Redeem error:', err);
            // User cancelled in MetaMask
            if (err.code === 'ACTION_REJECTED') {
                setError("คุณยกเลิกการทำรายการ");
                return;
            }

            // Not enough balance (transfer reverted)
            if (err.code === 'CALL_EXCEPTION') {
                setError("คุณมี RSU Token ไม่เพียงพอ");
                return;
            }

            // Fallback generic error
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setRedeemingId(null);
        }
    };


    if (!user) return null;

    return (
        <div
            style={{
                padding: '2rem 1rem',
                maxWidth: '1000px',
                margin: '0 auto',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
        >
            {/* Header */}
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                    แลก RSU Token เป็นคูปองส่วนลด
                </h1>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                    แลกโทเคนของคุณเป็นคูปองส่วนลดสุดพิเศษ เพื่อนำไปซื้ออาหารได้เลย!
                </p>
            </header>

            {/* User / wallet / balance bar */}
            <section
                style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: '#f5f5f5',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div style={{ fontSize: '0.9rem', color: '#555' }}>เข้าสู่ระบบด้วย</div>
                    <div style={{ fontWeight: 600 }}>
                        {user.username || user.name || `User #${user.user_id || user.id}`}
                    </div>
                    <div
                        style={{
                            fontSize: '0.8rem',
                            color: '#777',
                            marginTop: '0.25rem',
                        }}
                    >
                        {address ? (
                            <>กระเป๋า: {address.slice(0, 6)}...{address.slice(-4)}</>
                        ) : user.wallet_address ? (
                            <>กระเป๋า (จากระบบ): {user.wallet_address.slice(0, 6)}...
                                {user.wallet_address.slice(-4)}</>
                        ) : (
                            'ยังไม่ได้เชื่อมต่อกระเป๋า'
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                    {isConnected ? (
                        <>
                            <div style={{ fontSize: '0.85rem', color: '#555' }}>
                                ยอด RSUToken ของคุณ
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                {loadingBalance
                                    ? 'กำลังโหลด...'
                                    : balanceError
                                        ? 'ดึงยอดไม่ได้'
                                        : tokenBalance != null
                                            ? `${Number(tokenBalance).toFixed(4)} RSUToken`
                                            : '-- RSUToken'}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: 4 }}>
                                กรุณาเชื่อมต่อ MetaMask เพื่อดูยอด RSUToken
                            </div>
                            <button
                                onClick={connect}
                                style={{
                                    padding: '0.35rem 0.8rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    backgroundColor: '#2563eb',
                                    color: '#fff',
                                }}
                            >
                                เชื่อมต่อวอลเล็ต
                            </button>
                        </>
                    )}
                </div>
            </section>

            {/* Messages */}
            {message && (
                <div
                    style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: '#e6ffed',
                        border: '1px solid #b7eb8f',
                        fontSize: '0.9rem',
                    }}
                >
                    {message}
                </div>
            )}
            {error && (
                <div
                    style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: '#fff1f0',
                        border: '1px solid #ffa39e',
                        fontSize: '0.9rem',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Promotion list */}
            {loadingPromos ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                    กำลังโหลดโปรโมชั่น...
                </div>
            ) : promotions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                    ตอนนี้ยังไม่มีโปรโมชั่นให้แลก
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1.2rem',
                    }}
                >
                    {promotions.map((promo) => {
                        // check if user already has this promotion
                        const alreadyHave = userPromotions.some(
                            (up) => up.promotion_id === promo.promotion_id
                        );

                        const disabled =
                            alreadyHave || redeemingId === promo.promotion_id;

                        return (
                            <div
                                key={promo.promotion_id}
                                style={{
                                    borderRadius: '14px',
                                    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                                    overflow: 'hidden',
                                    background: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '260px',
                                }}
                            >
                                {/* Image */}
                                {promo.image_url ? (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '250px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6',
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={promo.image_url}
                                            alt={promo.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'scale-down', // change here if Max Verstappen
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            height: '140px',
                                            background:
                                                'linear-gradient(135deg, #ecfdf3, #eff6ff)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2rem',
                                        }}
                                    >
                                        🎟️
                                    </div>
                                )}

                                {/* Content */}
                                <div
                                    style={{
                                        padding: '1rem 1.1rem 0.9rem',
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <h2
                                        style={{
                                            fontSize: '1.1rem',
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        {promo.title}
                                    </h2>
                                    {promo.description && (
                                        <p
                                            style={{
                                                fontSize: '0.9rem',
                                                color: '#555',
                                                marginBottom: '0.75rem',
                                            }}
                                        >
                                            {promo.description}
                                        </p>
                                    )}

                                    <div
                                        style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        ใช้: {promo.token_cost} RSUToken
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 'auto',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                            {alreadyHave
                                                ? 'คุณมีโปรโมชั่นนี้แล้ว'
                                                : '*เมื่อแลกแล้วสามารถนำไปใช้ได้ในการสั่งอาหารครั้งถัดไป'}
                                        </span>
                                        <button
                                            onClick={() => handleRedeem(promo)}
                                            disabled={promo._redeemed || redeemingId === promo.promotion_id}
                                            style={{
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: promo._redeemed ? 'not-allowed' : 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                backgroundColor: promo._redeemed ? '#e5e7eb' : '#22c55e',
                                                color: promo._redeemed ? '#6b7280' : '#fff',
                                                opacity: redeemingId === promo.promotion_id ? 0.8 : 1,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {promo._redeemed
                                                ? 'แลกแล้ว'
                                                : redeemingId === promo.promotion_id
                                                    ? 'กำลังแลก...'
                                                    : 'แลกเลย'}
                                        </button>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
