'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  //  Popup Redeem states
  const [openRedeem, setOpenRedeem] = useState(false);
  const [billCode, setBillCode] = useState("");
  const [redeemResult, setRedeemResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleDeleteMyself = async () => {
    if (!user) return;
    if (!confirm('ต้องการลบบัญชีตัวเองหรือไม่?')) return;

    try {
      const res = await fetch(`/api/users?user_id=${user.user_id}`, {
        method: 'DELETE'
      });
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

  //  Redeem API
  const handleRedeem = async () => {
    if (!billCode.trim()) {
      alert("กรุณากรอก Bill Code");
      return;
    }

    setLoading(true);
    setRedeemResult(null);

    try {
      const res = await fetch("/api/redeem-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_code: billCode })
      });

      const data = await res.json();
      setRedeemResult(data);
    } catch (err) {
      console.error(err);
      setRedeemResult({ success: false, reason: "SERVER_ERROR" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>Profile</h1>
        <p>กรุณา Sign-in ก่อน</p>
      </div>
    );
  }

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

        {/* ปุ่มต่างๆ */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
          
          <button className="button" onClick={handleSignOut}>Sign-out</button>

          {/*ปุ่ม Redeem */}
          <button
            className="button"
            style={{ backgroundColor: '#d9534f', color: '#fff' }}
            onClick={() => { 
              setRedeemResult(null);
              setBillCode("");
              setOpenRedeem(true); 
            }}
          >
            Redeem
          </button>

          <button
            className="button button-danger"
            onClick={handleDeleteMyself}
          >
            Delete Account
          </button>

        </div>
      </div>

      {/*POPUP REDEEM BILL*/}
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
            width: "350px",
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ marginBottom: "1rem" }}>Redeem Bill</h2>

            <input
              placeholder="Enter bill code"
              value={billCode}
              onChange={(e) => setBillCode(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "16px"
              }}
            />

            <br /><br />

            {/* Submit */}
            <button
              onClick={handleRedeem}
              style={{
                backgroundColor: "#5cb85c",
                color: "#fff",
                padding: "0.5rem 1.2rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                marginRight: "8px"
              }}
              disabled={loading}
            >
              {loading ? "Checking..." : "Redeem"}
            </button>

            {/* Close */}
            <button
              onClick={() => setOpenRedeem(false)}
              style={{
                backgroundColor: "#777",
                color: "#fff",
                padding: "0.5rem 1.2rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Close
            </button>

            {/* แสดงผลลัพธ์ */}
            {redeemResult && (
              <p style={{
                marginTop: "1rem",
                fontWeight: "bold",
                color: redeemResult.success ? "green" : "red"
              }}>
                {redeemResult.success
                  ? "✔ Redeem Success"
                  : `Failed: ${redeemResult.reason}`}
              </p>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
