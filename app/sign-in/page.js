'use client'; // บอก Next.js ว่านี่คือ Client Component

import { useState } from 'react'; // ใช้สำหรับจัดการ State
import { useRouter } from 'next/navigation'; // ใช้ Router เปลี่ยนหน้า

export default function SignInPage() {
  const router = useRouter(); // เรียกใช้งาน router

  const [inputId, setInputId] = useState(''); // เก็บค่าที่กรอก Username หรือ Email
  const [password, setPassword] = useState(''); // เก็บค่าที่กรอก Password

  const handleSignIn = async () => {
    try {
      const res = await fetch('/api/users'); // ดึงข้อมูลผู้ใช้ทั้งหมดจาก API
      const data = await res.json(); // แปลงผลลัพธ์เป็น JSON

      if (Array.isArray(data)) { // เช็คว่า data เป็น array
        const found = data.find(u =>
          ((u.username === inputId) || (u.email === inputId)) &&
          (u.password === password)
        ); // หา user ที่ตรงกับ Username/Email และ Password

        if (found) {
          localStorage.setItem('user', JSON.stringify(found)); // เก็บข้อมูล user ลง localStorage
          alert('Sign-in success'); // แจ้งเตือนว่า Sign-in สำเร็จ

          router.push('/'); // กลับไปหน้าแรก
          setTimeout(() => {
            window.location.reload(); // รีเฟรชหน้าใหม่อีกรอบหลัง Sign-in
          }, 100);
        } else {
          alert('Username/Email or Password incorrect'); // แจ้งเตือนหากข้อมูลไม่ตรง
        }
      } else {
        alert('Error fetching users'); // แจ้งเตือนหากโหลด user ไม่สำเร็จ
      }
    } catch (err) {
      console.error(err); // แสดง error ใน console
      alert(err.message); // แจ้งเตือน error
    }
  };

  return (
    <div className="container">
      <h1>Sign-in</h1>

      <div>
        {/* ช่องกรอก Username หรือ Email */}
        <label>Username or Email:</label>
        <input
          className="input"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          placeholder="Type your username or email"
        />
      </div>

      <div>
        {/* ช่องกรอก Password */}
        <label>Password:</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Type your Password"
        />
      </div>

      {/* ปุ่มกด Sign-in */}
      <button className="button" onClick={handleSignIn}>Sign-in</button>
    </div>
  );
}
