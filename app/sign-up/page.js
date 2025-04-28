'use client'; // ประกาศว่าไฟล์นี้เป็น Client-side component

import { useState } from 'react'; // import useState เพื่อใช้งาน state
import { useRouter } from 'next/navigation'; // import useRouter สำหรับเปลี่ยนหน้า

export default function SignUpPage() {
  const router = useRouter(); // เรียกใช้งาน router

  // สร้าง state สำหรับข้อมูลฟอร์ม
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [userType, setUserType] = useState('regular');

  const handleSignUp = async () => {
    try {
      // ส่งข้อมูลไปที่ API เพื่อสมัครสมาชิก
      const resUser = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fname,
          lname,
          username,
          email,
          password,
          phone,
          address,
          user_type: userType,
          role: 'user', // บังคับสมัครสมาชิกใหม่ให้ role เป็น 'user'
        })
      });
      const dataUser = await resUser.json(); // แปลงผลลัพธ์ API เป็น JSON

      if (dataUser.error) {
        alert(dataUser.error); // ถ้ามี error ให้แจ้งเตือน
        return;
      }

      alert('Sign-up สำเร็จ! โปรด Sign-in'); // แจ้งว่าสมัครสำเร็จ
      router.push('/sign-in'); // เปลี่ยนหน้าไป Sign-in

    } catch (err) {
      console.error(err); // แสดง error ใน console
      alert(err.message); // แจ้งเตือน error
    }
  };

  return (
    <div className="container">
      <h1>Sign-up</h1>

      {/* ช่องกรอก First name */}
      <div>
        <label>First name:</label>
        <input
          className="input"
          value={fname}
          onChange={e => setFname(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Last name */}
      <div>
        <label>Last name:</label>
        <input
          className="input"
          value={lname}
          onChange={e => setLname(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Email */}
      <div>
        <label>Email:</label>
        <input
          className="input"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Username */}
      <div>
        <label>Username:</label>
        <input
          className="input"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Password */}
      <div>
        <label>Password:</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Phone */}
      <div>
        <label>Phone:</label>
        <input
          className="input"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>

      {/* ช่องกรอก Address */}
      <div>
        <label>Address:</label>
        <input
          className="input"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      {/* เลือกประเภท User */}
      <div>
        <label>User type:</label>
        <select
          className="input"
          value={userType}
          onChange={e => setUserType(e.target.value)}
        >
          <option value="regular">Regular</option>
          <option value="vip">Vip</option>
        </select>
      </div>

      {/* ปุ่ม Sign-up */}
      <button className="button" onClick={handleSignUp}>Sign-up</button>
    </div>
  );
}
