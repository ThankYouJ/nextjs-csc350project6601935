'use client'; 
// บอก Next.js ว่านี่คือ Client Component

import { useParams, useRouter } from 'next/navigation'; 
// useParams ใช้ดึง storeId จาก URL, useRouter ใช้เปลี่ยนหน้า
import { useEffect, useState } from 'react'; 
// นำ hook มาใช้เก็บและโหลดข้อมูล

export default function StoreDetailPage() {
  const router = useRouter(); 
  // ใช้สำหรับเปลี่ยนหน้า
  const { storeId } = useParams(); 
  // ดึง storeId จาก URL ตัวอย่างเช่น /store/1

  const [user, setUser] = useState(null); 
  // เก็บข้อมูล user ที่ login อยู่
  const [menuItems, setMenuItems] = useState([]); 
  // เก็บรายการเมนูอาหารของร้าน
  const [quantities, setQuantities] = useState({}); 
  // เก็บจำนวนเมนูที่ผู้ใช้เลือกแต่ละอัน
  const [storeName, setStoreName] = useState(''); 
  // เก็บชื่อร้าน

  useEffect(() => {
    // ดึงข้อมูล user จาก localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!storeId) return; 
    // ถ้าไม่มี storeId ก็ไม่ต้องโหลดต่อ

    // ดึงข้อมูลเมนูของร้าน
    fetch(`/api/menu_items?store_id=${storeId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMenuItems(data); // เก็บเมนู
          const initQty = {}; 
          data.forEach(item => {
            initQty[item.item_id] = 0;
          });
          setQuantities(initQty); // ตั้งค่าจำนวนทุกเมนูเริ่มต้นเป็น 0
        }
      })
      .catch(err => console.error(err));
      
    // ดึงชื่อร้าน
    fetch(`/api/stores?store_id=${storeId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.length > 0) {
          setStoreName(data[0].store_name);
        }
      })
      .catch(err => console.error(err));
  }, [storeId]);

  const handleChangeQuantity = (itemId, value) => {
    // เวลาเปลี่ยนจำนวนเมนู
    setQuantities(prev => ({
      ...prev,
      [itemId]: Number(value)
    }));
  };

  const totalPrice = menuItems.reduce((acc, item) => {
    // คำนวณราคารวมของเมนูที่เลือกทั้งหมด
    const qty = quantities[item.item_id] || 0;
    return acc + (item.item_price * qty);
  }, 0);

  const handleGoPayment = () => {
    // เมื่อกดปุ่ม Confirm
    if (!user) {
      alert('กรุณา Sign-in ก่อนสั่งอาหาร');
      router.push('/sign-in');
      return;
    }

    const selectedItems = menuItems
      .filter(it => (quantities[it.item_id] || 0) > 0)
      .map(it => ({
        ...it,
        quantity: quantities[it.item_id]
      }));

    if (selectedItems.length === 0) {
      alert('กรุณาเลือกเมนูอาหารก่อน');
      return;
    }

    // เก็บรายการที่เลือกไว้ใน localStorage
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));

    // ไปหน้าชำระเงิน
    router.push('/payment');
  };

  return (
    <div className="container">
      {/* ชื่อร้าน */}
      <h1>เมนูอาหารของร้าน {storeName ? storeName : `#${storeId}`}</h1>
      <div className="flex">
        {/* วนแสดงเมนูอาหาร */}
        {menuItems.map(item => (
          <div key={item.item_id} className="card" style={{ width: '240px' }}>
            {/* รูปเมนู ถ้ามี */}
            {item.item_image && (
              <img src={item.item_image} alt="Menu item" />
            )}
            {/* ชื่อเมนู */}
            <b>{item.item_name}</b>
            {/* คำอธิบายเมนู */}
            <div>{item.description}</div>
            {/* ราคา */}
            <div>ราคา: {item.item_price} บาท</div>
            {/* ช่องใส่จำนวน */}
            <div style={{ marginTop: '4px' }}>
              <label>จำนวน: </label>
              <input
                type="number"
                min="0"
                value={quantities[item.item_id] || 0}
                onChange={e => handleChangeQuantity(item.item_id, e.target.value)}
                style={{ width: '60px', marginLeft: '4px' }}
              />
            </div>
          </div>
        ))}
      </div>

      <hr />

      {/* ราคารวมทั้งหมด */}
      <h3>ราคารวม: {totalPrice.toFixed(2)} บาท</h3>

      {/* ปุ่มไปหน้าชำระเงิน */}
      <button className="button" onClick={handleGoPayment}>
        Confirm
      </button>
    </div>
  );
}
