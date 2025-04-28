'use client'; // บอก Next.js ว่านี่คือ Client Component

import { useEffect, useState } from 'react'; // ใช้ useState, useEffect จาก React

export default function ProfilePage() {
  const [user, setUser] = useState(null); // เก็บข้อมูล user ที่ login

  useEffect(() => {
    // โหลด user จาก localStorage ตอนเปิดหน้า
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    if (stored) {
      setUser(JSON.parse(stored)); // แปลง string เป็น object แล้วเก็บใน state
    }
  }, []); // ทำงานครั้งเดียวตอนโหลดหน้า

  const handleSignOut = () => {
    // ฟังก์ชันออกจากระบบ
    localStorage.removeItem('user'); // ลบ user ออกจาก localStorage
    window.location.href = '/'; // กลับไปหน้าแรก
  };

  const handleDeleteMyself = async () => {
    // ฟังก์ชันลบบัญชีตัวเอง
    if (!user) return; // ถ้าไม่มี user ไม่ต้องทำอะไร
    if (!confirm('ต้องการลบบัญชีตัวเองหรือไม่?')) return; // ถามยืนยันก่อนลบ
    try {
      const res = await fetch(`/api/users?user_id=${user.user_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        alert('ลบบัญชีสำเร็จ'); // แจ้งเตือนว่าลบสำเร็จ
        localStorage.removeItem('user'); // ลบข้อมูล user
        window.location.href = '/'; // กลับไปหน้าแรก
      } else {
        alert(data.error); // แจ้งเตือนถ้าเกิด error
      }
    } catch (err) {
      console.error(err); // แสดง error ใน console
    }
  };

  if (!user) {
    // ถ้า user ยังไม่ login
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

      {/* แสดงข้อมูล user */}
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

        {/* ปุ่ม Sign-out และ Delete Account */}
        <div style={{ marginTop: '1rem' }}>
          <button className="button" onClick={handleSignOut}>Sign-out</button>
          <button className="button button-danger" style={{ marginLeft: '8px' }} onClick={handleDeleteMyself}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
