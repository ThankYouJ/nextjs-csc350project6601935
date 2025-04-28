'use client'; 
// บอกว่าไฟล์นี้เป็น Client-side component

import { useEffect, useState } from 'react'; 
// ใช้ hook สำหรับจัดการข้อมูลในหน้า

export default function OrdersPage() {
  const [user, setUser] = useState(null); // เก็บข้อมูล user
  const [orders, setOrders] = useState([]); // เก็บข้อมูลออเดอร์
  const [orderItems, setOrderItems] = useState({}); // เก็บข้อมูลเมนูแต่ละ order
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    // โหลดข้อมูล user และออเดอร์ของ user
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);

    fetch(`/api/orders?user_id=${u.user_id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setOrders(data);
      });
  }, []);

  const handleExpand = async (order_id) => {
    if (expandedOrders[order_id]) {
      // ถ้าเปิดอยู่แล้ว ก็กดปิด (แค่แก้ expandedOrders)
      setExpandedOrders(prev => ({ ...prev, [order_id]: false }));
      return;
    }
    if (!orderItems[order_id]) {
      // ถ้าไม่เคยโหลดเมนูมาก่อน ➔ fetch
      try {
        const res = await fetch(`/api/order_items?order_id=${order_id}`);
        const data = await res.json();
        if (!data.error) {
          setOrderItems(prev => ({ ...prev, [order_id]: data }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    setExpandedOrders(prev => ({ ...prev, [order_id]: true }));
  };

  const handleCancelOrder = async (order_id) => {
    // ยกเลิก order
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกออเดอร์นี้?')) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id, status: 'Cancelled' })
      });
      const data = await res.json();
      if (!data.error) {
        alert('ยกเลิกออเดอร์เรียบร้อย');
        setOrders(prev => prev.map(o => o.order_id === order_id ? { ...o, status: 'Cancelled' } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calcSubtotal = (items) => {
    // คำนวณรวมราคาของเมนูในแต่ละ order
    return items.reduce((acc, it) => acc + it.quantity * it.item_price, 0);
  };

  if (!user) {
    // ถ้ายังไม่ได้ login
    return (
      <div className="container">
        <h1>Orders</h1>
        <p>กรุณา Sign-in ก่อน</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>My Orders</h1>
      <div className="flex">
        {/* แสดงออเดอร์ทั้งหมดของ user */}
        {orders.map(order => {
          const items = orderItems[order.order_id] || [];
          const isOpen = expandedOrders[order.order_id];
          const subSum = calcSubtotal(items);

          return (
            <div key={order.order_id} className="card" style={{ width: '320px' }}>
              <div>
                <b>Order #{order.order_id}</b>
                <div style={{ marginTop: '8px' }}>
                  <button className="button" onClick={() => handleExpand(order.order_id)}>
                    {isOpen ? 'ซ่อน' : 'แสดงรายการ'}
                  </button>
                  {/* ปุ่มยกเลิกเฉพาะออเดอร์ Pending */}
                  {order.status === 'Pending' && (
                    <button className="button button-danger" onClick={() => handleCancelOrder(order.order_id)} style={{ marginLeft: '8px' }}>
                      ยกเลิกออเดอร์
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div>Status: {order.status}</div>
                <div>Total: {order.total_price}</div>
                <div>Delivery Fee: {order.delivery_fee}</div>
                <div>Discount: {order.discount}</div>
                <div>
                  {/* แปลงเวลาเป็น format ไทย */}
                  Order time: {new Date(order.order_time).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* แสดงเมนูของ order นั้นถ้าขยายอยู่ */}
              {isOpen && (
                <div style={{ marginTop: '8px', background: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
                  <b>Order Items</b>
                  {items.map(oi => (
                    <div key={oi.order_item_id} style={{ marginTop: '4px' }}>
                      {oi.item_name} x {oi.quantity} = {oi.item_price * oi.quantity} บาท
                    </div>
                  ))}
                  <b style={{ marginTop: '8px', display: 'block' }}>รวม: {subSum} บาท</b>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
