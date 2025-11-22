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

  // เพิ่ม state สำหรับจัดการ Modal และ Bill Code
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBillCode, setCreatedBillCode] = useState('');

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
        // สำเร็จ: เก็บ Bill Code และแสดง Modal
        setCreatedBillCode(data.bill_code);
        setShowSuccessModal(true);
        
        // ล้างตะกร้าแต่ยังไม่ redirect ทันที รอให้ user กดปิด Modal เอง
        localStorage.removeItem('selectedItems'); 
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCopyBillCode = () => {
    // ฟังก์ชันก็อปปี้ Bill Code
    navigator.clipboard.writeText(createdBillCode);
    alert('คัดลอก Bill Code เรียบร้อย: ' + createdBillCode);
  };

  const handleCloseModal = () => {
    // เมื่อปิด Modal ให้กลับหน้าแรก
    setShowSuccessModal(false);
    router.push('/'); 
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
      <button className="button" onClick={handleConfirm}>Confirm</button>

      {/* Modal แสดงผลเมื่อชำระเงินสำเร็จ */}
      {showSuccessModal && (
        <div className="modal-background" style={{zIndex: 2000}}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>ชำระเงินเรียบร้อย!</h2>
            <p>ขอบคุณสำหรับการสั่งซื้อ</p>
            
            <div style={{ 
              background: '#f3f4f6', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              margin: '1.5rem 0',
              border: '1px dashed #ccc' 
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#666' }}>Bill Code ของคุณ:</p>
              <h1 style={{ margin: 0, fontSize: '2rem', wordBreak: 'break-all', color: '#333' }}>
                {createdBillCode}
              </h1>
            </div>

            <div className="flex center" style={{ gap: '1rem' }}>
              <button className="button" onClick={handleCopyBillCode}>
                Copy Bill Code
              </button>
              <button className="button button-danger" onClick={handleCloseModal}>
                กลับหน้าแรก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}