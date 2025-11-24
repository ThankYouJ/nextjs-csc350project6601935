'use client';

import { useEffect, useState } from 'react';

// รูป Placeholder กรณีไม่มีรูป
const LOGO_DEFAULT = 'https://via.placeholder.com/150?text=No+Image';

export default function MerchantPage() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [menus, setMenus] = useState([]);

  // ฟอร์มเมนู
  const [menuForm, setMenuForm] = useState({
    item_name: '',
    item_price: 0,
    available: 1,
    description: '',
    item_image: '',
  });

  const [editingItem, setEditingItem] = useState(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // View (เมนู/ออเดอร์)
  const [view, setView] = useState("menus");
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // ---------------------------
  // 🔵 ฟังก์ชัน Upload ImgBB
  // ---------------------------
  async function uploadToImgBB(file) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_KEY;
      if (!apiKey) {
        alert("กรุณาตั้งค่า NEXT_PUBLIC_IMGBB_KEY ในไฟล์ .env ก่อน");
        return null;
      }

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        return data.data.url;
      } else {
        alert("อัปโหลดรูปไป ImgBB ไม่สำเร็จ");
        return null;
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
      return null;
    }
  }

  // ----------------------------
  // โหลดข้อมูล Merchant + ร้าน
  // ----------------------------
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = "/";
      return;
    }

    const u = JSON.parse(stored);
    // อนุญาตให้เข้ามาได้ถ้ามี User (แต่ถ้าไม่ใช่เจ้าของร้าน ระบบจะบอกเองว่าไม่มีร้าน)
    setUser(u);

    // ใช้ user_id ในการค้นหาร้าน (ตาม API ที่แก้ไปก่อนหน้า)
    fetch(`/api/stores?user_id=${u.user_id}`)
      .then(res => res.json())
      .then(data => {
        let myStore = null;

        // API อาจส่งกลับมาเป็น Array หรือ Object เดียว
        if (Array.isArray(data)) {
            if (data.length > 0) myStore = data[0];
        } else if (data.store_id) {
            myStore = data;
        }

        if (!myStore) {
          setStore(null);
          return;
        }

        setStore(myStore);

        // โหลดเมนูร้านนี้
        fetch(`/api/menu_items?store_id=${myStore.store_id}`)
          .then(r => r.json())
          .then(m => setMenus(m));

        // โหลดออเดอร์ร้านนี้ (API ต้องรองรับ)
        // ถ้ายังไม่มี API merchant/orders ให้ใช้ api/orders?store_id=... แทนชั่วคราวได้
        fetch(`/api/orders?store_id=${myStore.store_id}`) 
          .then(r => r.json())
          .then(o => {
             // กรองเฉพาะออเดอร์ที่ไม่ใช่ Cancelled (หรือจะเอาหมดก็ได้)
             setOrders(o || []);
          });
      });
  }, []);

  if (!user) return <div>Loading...</div>;

  if (store === null) {
    return (
      <div className="container">
        <h1>Merchant Panel</h1>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>คุณยังไม่มีร้านในระบบ</h2>
            <p>กรุณาติดต่อ Admin หรือลงทะเบียนร้านค้า</p>
        </div>
      </div>
    );
  }

  if (!store) return <div>Loading...</div>;

  // -------------------------
  // เปิด modal เพิ่มเมนูใหม่
  // -------------------------
  const openNewMenuModal = () => {
    setEditingItem(null);
    setMenuForm({
      item_name: '',
      item_price: 0,
      available: 1,
      description: '',
      item_image: '',
    });
    setShowMenuModal(true);
  };

  // -------------------------
  // เปิด modal แก้ไขเมนู
  // -------------------------
  const openEditMenuModal = (item) => {
    setEditingItem(item);
    setMenuForm({ ...item });
    setShowMenuModal(true);
  };

  // -------------------------
  // บันทึกเมนู
  // -------------------------
  const saveMenu = async () => {
    const method = editingItem ? "PUT" : "POST";
    const payload = {
      ...menuForm,
      item_price: Number(menuForm.item_price),
      store_id: store.store_id,
    };
    
    // ถ้าเป็นการแก้ไข ต้องส่ง item_id ไปด้วย
    if (editingItem) {
        payload.item_id = editingItem.item_id;
    }

    try {
        const res = await fetch("/api/menu_items", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.error) {
            alert(editingItem ? "แก้ไขเมนูสำเร็จ" : "สร้างเมนูสำเร็จ");
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
  };

  // -------------------------
  // ลบเมนู
  // -------------------------
  const deleteMenu = async () => {
    if (!editingItem) return;

    if (!confirm("ต้องการลบเมนูนี้หรือไม่?")) return;

    await fetch(`/api/menu_items?item_id=${editingItem.item_id}`, { method: "DELETE" });
    alert("ลบเมนูสำเร็จ");
    window.location.reload();
  };

  // -------------------------
  // Toggle รายการออเดอร์
  // -------------------------
  const toggleExpandOrder = async (order_id) => {
    if (expandedOrders[order_id]) {
      setExpandedOrders(prev => ({ ...prev, [order_id]: false }));
    } else {
      const res = await fetch(`/api/order_items?order_id=${order_id}`);
      const data = await res.json();
      setOrderItems(prev => ({ ...prev, [order_id]: data }));
      setExpandedOrders(prev => ({ ...prev, [order_id]: true }));
    }
  };

  // -------------------------
  // เปลี่ยนสถานะออเดอร์
  // -------------------------
  const handleChangeOrderStatus = async (order_id, newStatus) => {
    try {
        await fetch("/api/orders", { // ใช้ API orders ทั่วไป
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id, status: newStatus })
        });

        setOrders(prev =>
            prev.map(o => o.order_id === order_id ? { ...o, status: newStatus } : o)
        );

        alert("อัปเดตสถานะสำเร็จ");
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="container">
      <h1>Merchant Panel</h1>

      <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
         {store.store_image && <img src={store.store_image} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover'}} />}
         <div>
            <h2 style={{margin: 0}}>ร้าน: {store.store_name}</h2>
            <p style={{margin: 0, color: '#666'}}>{store.location}</p>
         </div>
      </div>

      <div className="flex" style={{ margin: "1rem 0", gap: '10px' }}>
        <button 
            className="button" 
            onClick={() => setView("menus")}
            style={{ backgroundColor: view === 'menus' ? '#0070f3' : '#ccc' }}
        >
            จัดการเมนู
        </button>
        <button 
            className="button" 
            onClick={() => setView("orders")}
            style={{ backgroundColor: view === 'orders' ? '#0070f3' : '#ccc' }}
        >
            รายการออเดอร์
        </button>
      </div>

      {/* ---------------- MENU VIEW ---------------- */}
      {view === "menus" && (
        <div>
            <div style={{ marginBottom: 12 }}>
                <button className="button" onClick={openNewMenuModal} style={{ backgroundColor: '#28a745' }}>+ เพิ่มเมนูใหม่</button>
            </div>
            <div className="flex" style={{ flexWrap: "wrap" }}>
            {menus.map(m => (
                <div key={m.item_id} className="card" style={{ width: 220, margin: 10, cursor: "pointer", padding: 0, overflow: 'hidden' }}
                    onClick={() => openEditMenuModal(m)}>
                <img src={m.item_image || LOGO_DEFAULT} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                <div style={{ padding: '10px' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{m.item_name}</h4>
                    <p style={{ margin: 0, color: 'green' }}>{m.item_price} บาท</p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>{m.description}</p>
                </div>
                </div>
            ))}
            </div>
        </div>
      )}

      {/* ---------------- ORDER VIEW ---------------- */}
      {view === "orders" && (
        <div>
          <h3>ออเดอร์ของร้าน</h3>
          {orders.length === 0 && <p>ยังไม่มีออเดอร์</p>}
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                <div>
                    <b>Order #{order.order_id}</b>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {new Date(order.order_time).toLocaleString('th-TH')}
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                        className="input"
                        style={{ marginBottom: 0, width: '140px' }}
                        value={order.status}
                        onChange={(e) => handleChangeOrderStatus(order.order_id, e.target.value)}
                    >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Delivering">Delivering</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <button className="button" onClick={() => toggleExpandOrder(order.order_id)} style={{ marginTop: 0 }}>
                    {expandedOrders[order.order_id] ? "ซ่อน" : "ดูรายการ"}
                    </button>
                </div>
              </div>

              {expandedOrders[order.order_id] && (
                <div style={{ marginTop: 10, background: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                  {orderItems[order.order_id] ? (
                      orderItems[order.order_id].map(it => (
                        <div key={it.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '4px 0' }}>
                            <span>{it.item_name} x {it.quantity}</span>
                            <span>{(it.item_price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))
                  ) : (
                      <span>กำลังโหลดรายการ...</span>
                  )}
                  <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>
                      รวม: {order.total_price} บาท
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------------- MODAL ---------------- */}
      {showMenuModal && (
        <div className="modal-background" style={{zIndex: 9999}} onClick={(e) => e.target === e.currentTarget && setShowMenuModal(false)}>
          <div className="modal-content">

            <h3>{editingItem ? "แก้ไขเมนู" : "เมนูใหม่"}</h3>

            <label>ชื่อเมนู:</label>
            <input
              className="input"
              value={menuForm.item_name}
              onChange={(e) => setMenuForm({ ...menuForm, item_name: e.target.value })}
            />

            <label>ราคา:</label>
            <input
              className="input"
              type="number"
              value={menuForm.item_price}
              onChange={(e) => setMenuForm({ ...menuForm, item_price: e.target.value })}
            />

            <label>รายละเอียด:</label>
            <textarea
              className="input"
              value={menuForm.description}
              onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
            />

            <label>เลือกรูปเมนู (Upload):</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const url = await uploadToImgBB(file);
                if (url) setMenuForm({ ...menuForm, item_image: url });
              }}
            />

            {menuForm.item_image && (
              <img
                src={menuForm.item_image}
                alt="preview"
                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', marginTop: 10, borderRadius: 8, border: '1px solid #ddd' }}
              />
            )}

            <label style={{ marginTop: '10px', display: 'block' }}>หรือใส่ URL รูปเอง:</label>
            <input
              className="input"
              value={menuForm.item_image}
              onChange={(e) => setMenuForm({ ...menuForm, item_image: e.target.value })}
            />

            <div style={{ marginTop: 15, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="button" onClick={saveMenu} style={{ marginTop: 0 }}>Save</button>

              {editingItem && (
                <button className="button button-danger" onClick={deleteMenu} style={{ marginTop: 0 }}>
                  Delete
                </button>
              )}

              <button className="button" style={{ backgroundColor: '#6c757d', marginTop: 0 }} onClick={() => setShowMenuModal(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}