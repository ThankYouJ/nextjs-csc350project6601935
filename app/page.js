'use client'; // ประกาศว่าเป็น Client-side component

import { useEffect, useState } from 'react'; // ดึง useEffect และ useState มาใช้
import Link from 'next/link'; // ดึง Link ของ Next.js มาใช้ลิงก์เปลี่ยนหน้า

export default function HomePage() {
  const [stores, setStores] = useState([]); // สร้าง state สำหรับเก็บข้อมูลร้านค้า
  const [user, setUser] = useState(null); // สร้าง state สำหรับเก็บข้อมูลผู้ใช้งาน

  useEffect(() => {
    // โหลดข้อมูล user จาก localStorage ตอนเปิดหน้า
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // ถ้ามี user ใน localStorage ให้นำมาเก็บใน state
    }

    // โหลดข้อมูลร้านค้าจาก API
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStores(data); // ถ้าโหลดสำเร็จ นำข้อมูลร้านมาเก็บใน state
        }
      });
  }, []); // ทำงานครั้งเดียวเมื่อโหลดหน้า

  return (
    <div className="container">
      <h1>Home - เลือกร้านอาหาร</h1>
      <div className="flex">
        {/* แสดงรายการร้านค้าทั้งหมด */}
        {stores.map(store => (
          <Link key={store.store_id} href={`/store/${store.store_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ width: '280px', cursor: 'pointer' }}>
              {/* แสดงรูปร้านถ้ามี */}
              {store.store_image && (
                <img src={store.store_image} alt={store.store_name} />
              )}
              {/* แสดงชื่อร้าน */}
              <h3>{store.store_name}</h3>
              {/* แสดงที่ตั้งร้าน */}
              <p>{store.location}</p>
              {/* แสดงเบอร์โทรร้าน */}
              <p>Tel: {store.store_phone}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
