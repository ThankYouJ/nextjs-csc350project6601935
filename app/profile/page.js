'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function ProfilePage() {
  // State สำหรับข้อมูล User
  const [user, setUser] = useState(null);

  // State สำหรับ Modal และระบบ Redeem
  const [openRedeem, setOpenRedeem] = useState(false);
  const [billCode, setBillCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [redeemResult, setRedeemResult] = useState(null); // เก็บผลลัพธ์เพื่อแสดง Success/Fail
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. โหลดข้อมูล User
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    setUser(JSON.parse(stored));

    // 2. เช็ค Wallet
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert('กรุณาติดตั้ง MetaMask');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setWalletAddress(signer.address);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleDeleteMyself = async () => {
    if (!user) return;
    if (!confirm('ต้องการลบบัญชีตัวเองหรือไม่?')) return;
    try {
      const res = await fetch(`/api/users?user_id=${user.user_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        alert('ลบบัญชีสำเร็จ');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ฟังก์ชันกด Redeem ใน Modal
  const handleRedeemSubmit = async () => {
    if (!billCode) return alert('กรุณากรอก Bill Code');
    if (!walletAddress) return alert('กรุณาเชื่อมต่อกระเป๋า Wallet ก่อน');

    setLoading(true);
    setRedeemResult(null); // ล้างค่าเก่าก่อนเริ่มใหม่

    try {
      // เรียก API ตัวใหม่ (โอนเหรียญ + ตัดบิล)
      const res = await fetch('/api/redeem-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_code: billCode,
          wallet_address: walletAddress
        })
      });

      const data = await res.json();

      // เก็บผลลัพธ์ไว้แสดงใน Modal
      if (data.success) {
        setRedeemResult({ 
            success: true, 
            message: data.message, 
            txHash: data.txHash 
        });
        setBillCode(''); // ล้างช่องหลังสำเร็จ
      } else {
        setRedeemResult({ 
            success: false, 
            message: data.message 
        });
      }

    } catch (err) {
      console.error(err);
      setRedeemResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Server' });
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันปิด Modal
  const handleCloseModal = () => {
    setOpenRedeem(false);
    setRedeemResult(null); // ล้างผลลัพธ์เมื่อปิด
    setBillCode('');
  };

  if (!user) return null;

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center' }}>My Profile</h1>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <p><b>ID:</b> {user.user_id}</p>
        <p><b>Username:</b> {user.username}</p>
        <p><b>First name:</b> {user.fname}</p>
        <p><b>Last name:</b> {user.lname}</p>
        <p><b>E-mail:</b> {user.email}</p>
        <p><b>Phone:</b> {user.user_phone}</p>
        <p><b>Address:</b> {user.user_address}</p>
        <p><b>Type:</b> {user.user_type}</p>
        <p><b>Role:</b> {user.role}</p>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* ปุ่ม Sign-out */}
          <button className="button" onClick={handleSignOut}>Sign-out</button>

          {/* ปุ่มเปิด Modal Redeem */}
          <button
            className="button"
            style={{ backgroundColor: '#28a745', color: '#fff' }} // สีเขียว
            onClick={() => setOpenRedeem(true)}
          >
            Redeem Reward
          </button>

          {/* ปุ่มลบบัญชี */}
          <button
            className="button button-danger"
            onClick={handleDeleteMyself}
          >
            Delete Account
          </button>

        </div>
      </div>

      {/* --- POPUP REDEEM BILL (MODAL) --- */}
      {openRedeem && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: "10px",
            width: "90%",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ marginBottom: "1rem" }}>Redeem Bill Reward</h2>

            {/* 1. ส่วนเชื่อมต่อ Wallet */}
            <div style={{ marginBottom: '15px' }}>
                {walletAddress ? (
                    <div style={{ fontSize: '0.85rem', color: 'green', background: '#e8f5e9', padding: '5px', borderRadius: '4px' }}>
                        Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </div>
                ) : (
                    <button 
                        onClick={handleConnectWallet}
                        style={{ padding: '5px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f9fa' }}
                    >
                        🦊 Connect Wallet First
                    </button>
                )}
            </div>

            {/* 2. ช่องกรอก Bill Code */}
            <input
              placeholder="Enter Bill Code (16 digits)"
              value={billCode}
              onChange={(e) => setBillCode(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "16px",
                marginBottom: "15px"
              }}
            />

            {/* 3. ปุ่มกด Redeem */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  onClick={handleRedeemSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#ccc" : "#0070f3", // สีฟ้า
                    color: "#fff",
                    padding: "0.6rem 1.5rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    minWidth: "100px"
                  }}
                >
                  {loading ? "Checking..." : "Redeem"}
                </button>

                <button
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: "#6c757d", // สีเทา
                    color: "#fff",
                    padding: "0.6rem 1.5rem",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  Close
                </button>
            </div>

            {/* 4. ส่วนแสดงผลลัพธ์ (Success/Fail) */}
            {redeemResult && (
              <div style={{ marginTop: "1.5rem", textAlign: "left", background: "#f8f9fa", padding: "10px", borderRadius: "6px", fontSize: "0.9rem" }}>
                {redeemResult.success ? (
                    <div style={{ color: "green" }}>
                        <strong>✔ สำเร็จ!</strong><br/>
                        {redeemResult.message}<br/>
                        <a 
                            href={`https://sepolia.etherscan.io/tx/${redeemResult.txHash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: '#0070f3', textDecoration: 'underline' }}
                        >
                            ดู Transaction
                        </a>
                    </div>
                ) : (
                    <div style={{ color: "red" }}>
                        <strong>❌ ผิดพลาด:</strong> {redeemResult.message}
                    </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}