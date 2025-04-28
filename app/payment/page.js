'use client'; // บอก Next.js ว่านี่คือ Client Component

import { useEffect, useState } from 'react'; // ใช้จัดการข้อมูล State และ Lifecycle
import { useRouter } from 'next/navigation'; // ใช้สำหรับเปลี่ยนเส้นทางหน้า

export default function PaymentPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);
  const [user, setUser] = useState(null);

  const [totalPrice, setTotalPrice] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalDiscount, setFinalDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    // โหลดข้อมูล user และ selectedItems จาก localStorage
    const userData = localStorage.getItem('user');
    const itemsData = localStorage.getItem('selectedItems');

    if (!userData) {
      alert('กรุณา Sign-in ก่อนสั่งอาหาร');
      router.push('/sign-in');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (!itemsData) {
      alert('ไม่พบรายการอาหาร');
      router.push('/');
      return;
    }

    const items = JSON.parse(itemsData);
    setSelectedItems(items);

    // คำนวณราคาทั้งหมด
    const sum = items.reduce((acc, it) => acc + (it.item_price * it.quantity), 0);
    setTotalPrice(sum);

    // ตั้งค่า Delivery และ Discount ตามประเภท User
    if (parsedUser.user_type === 'vip') {
      setDeliveryFee(0);
      setDiscountPercent(20);
      setFinalDiscount(sum * 0.20);
      setFinalTotal(sum * 0.80);
    } else {
      setDeliveryFee(20);
      setDiscountPercent(0);
      setFinalDiscount(0);
      setFinalTotal(sum + 20);
    }
  }, []);

  const handleConfirm = async () => {
    // ฟังก์ชันกดปุ่ม "ยืนยันการชำระเงิน"
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          delivery_fee: deliveryFee,
          discount: finalDiscount,
          total_price: finalTotal,
          status: 'Pending',
          order_items: selectedItems.map(it => ({
            item_id: it.item_id,
            quantity: it.quantity,
            item_price: it.item_price
          }))
        })
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('ชำระเงินเรียบร้อย');
        localStorage.removeItem('selectedItems'); // ล้างข้อมูลที่เลือก
        router.push('/'); // กลับหน้าแรก
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  if (!user) return null; // ถ้าไม่มี user ยังไม่โหลด

  return (
    <div className="container">
      <h1>ชำระเงิน</h1>

      {/* รายการอาหารที่เลือก */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>รายการอาหาร:</h3>
        {selectedItems.map((it, idx) => (
          <div key={idx} style={{ marginBottom: '8px' }}>
            {it.item_name} x {it.quantity} = {(it.item_price * it.quantity).toFixed(2)} บาท
          </div>
        ))}
      </div>

      {/* สรุปค่าใช้จ่าย */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p>รวมราคาอาหาร: {totalPrice.toFixed(2)} บาท</p>
        <p>ค่าส่ง: {deliveryFee.toFixed(2)} บาท</p>
        <p>ส่วนลด ({discountPercent}%): {finalDiscount.toFixed(2)} บาท</p>
        <h3>รวมทั้งสิ้น: {finalTotal.toFixed(2)} บาท</h3>
      </div>

      {/* แสดง QR สำหรับชำระเงิน */}
      <div className="center" style={{ marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p>QR การชำระเงิน:</p>
          <img
            src="https://i.imgur.com/hYxveJ1.png"
            alt="QR Payment"
            style={{ width: '200px', border: '1px solid #ccc', marginTop: '0.5rem' }}
          />
        </div>
      </div>

      {/* ปุ่มยืนยัน */}
      <button className="button" onClick={handleConfirm}>ยืนยันการชำระเงิน</button>
    </div>
  );
}
