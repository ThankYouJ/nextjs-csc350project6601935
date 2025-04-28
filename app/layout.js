'use client'; 
// บอก Next.js ว่าไฟล์นี้เป็น Client Component (เพราะมีการใช้ useState, useEffect)

import './globals.css'; 
// นำเข้าไฟล์ CSS พื้นฐานทั้งหมดที่ตกแต่งทั้งเว็บ

import Link from 'next/link'; 
// ใช้สำหรับสร้างลิงก์เปลี่ยนหน้าแบบเร็ว (ไม่โหลดใหม่ทั้งหน้า)

import { useEffect, useState } from 'react'; 
// นำ hook useEffect และ useState มาใช้ควบคุมข้อมูลภายใน component

export default function RootLayout({ children }) { 
// สร้างฟังก์ชัน RootLayout เป็น component หลัก คลุมทั้งเว็บ
  const [user, setUser] = useState(null); 
  // เก็บข้อมูล user login ใน state ถ้ายังไม่มี user = null

  useEffect(() => {
    const stored = localStorage.getItem('user');
    // ดึงข้อมูล user จาก localStorage (ถ้ามีเก็บไว้)
    if (stored) {
      setUser(JSON.parse(stored));
      // ถ้ามี user เก็บไว้ ให้ setUser เป็น object ที่ได้จาก localStorage
    }
  }, []);
  // ทำงานครั้งเดียวตอน component โหลดขึ้นมา

  const handleSignOut = () => {
    localStorage.removeItem('user');
    // ลบข้อมูล user ใน localStorage ทิ้ง
    window.location.href = '/';
    // แล้วพากลับไปหน้าแรก
  };
 
  return (
    <html lang="en">
      <body>
        {/* Header (แถบด้านบน) */}
        <header style={{
          backgroundColor: '#ffffff', // สีพื้นหลังขาว
          padding: '1rem 2rem', // padding รอบๆตัว
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // เงาเบาๆ
          position: 'sticky', // header ติดอยู่ข้างบน
          top: 0,
          zIndex: 1000, // ลอยอยู่บนสุด
        }}>
          {/* โลโก้/ลิงก์กลับหน้าแรก */}
          <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>
            <h2 style={{ margin: 0, cursor: 'pointer', fontSize: '24px', fontWeight: 'bold' }}>
              My Restaurant
            </h2>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {!user && (
              <>
                {/* ถ้ายังไม่ได้ login แสดงปุ่ม Sign-in และ Sign-up */}
                <Link href="/sign-in" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                  Sign-in
                </Link>
                <Link href="/sign-up" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                  Sign-up
                </Link>
              </>
            )}
            {user && (
              <>
                {/* ถ้า login แล้ว แสดงลิงก์ Orders, Profile และ Sign-out */}
                <Link href="/orders" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                  Orders
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                    Admin Panel
                  </Link>
                )}
                <Link href="/profile" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>
                  {user.fname || 'Profile'}
                  {/* แสดงชื่อจริง user ถ้ามี */}
                </Link>
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

        {/* Main Content */}
        <main style={{ padding: '2rem' }}>
          {children}
          {/* ตรงนี้จะถูกแทนที่ด้วยหน้าต่างๆ (HomePage, Orders, Profile, Admin ฯลฯ) */}
        </main>
      </body>
    </html>
  );
}
