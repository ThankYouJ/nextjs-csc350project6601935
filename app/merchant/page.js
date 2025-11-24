'use client';

import { useEffect, useState } from 'react';

const LOGO_CHATRAMUE = '/mnt/data/chatramue.png';
const LOGO_DQ = '/mnt/data/DQ.png';
const LOGO_KFC = '/mnt/data/KFC.png';

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
    if (u.role !== "merchant") {
      alert("Only merchant allowed");
      window.location.href = "/";
      return;
    }

    setUser(u);

    fetch(`/api/stores?merchant_id=${u.user_id}`)
      .then(res => res.json())
      .then(data => {
        let myStore = null;

        if (!Array.isArray(data) && data.store_id) myStore = data;
        else if (Array.isArray(data)) myStore = data.find(s => s.merchant_id == u.user_id);

        if (!myStore) {
          setStore(null);
          return;
        }

        setStore(myStore);

        // โหลดเมนูร้านนี้
        fetch(`/api/menu_items?store_id=${myStore.store_id}`)
          .then(r => r.json())
          .then(m => setMenus(m));

        // โหลดออเดอร์ร้านนี้
        fetch(`/api/merchant/orders?store_id=${myStore.store_id}`)
          .then(r => r.json())
          .then(o => setOrders(o || []));
      });
  }, []);

  if (!user) return <div>Loading...</div>;

  if (store === null) {
    return (
      <div className="container">
        <h1>Merchant Panel</h1>
        <p>คุณยังไม่มีร้านในระบบ</p>
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

    const res = await fetch("/api/menu_items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.error) {
      alert(editingItem ? "แก้ไขเมนูสำเร็จ" : "สร้างเมนูสำเร็จ");
      window.location.reload();
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
    await fetch("/api/merchant/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id, status: newStatus })
    });

    setOrders(prev =>
      prev.map(o => o.order_id === order_id ? { ...o, status: newStatus } : o)
    );

    alert("อัปเดตสถานะสำเร็จ");
  };

  return (
    <div className="container">
      <h1>Merchant Panel</h1>

      <h2>ร้านของคุณ: {store.store_name}</h2>

      <div style={{ marginTop: 12 }}>
        <button className="button" onClick={openNewMenuModal}>+ เพิ่มเมนูใหม่</button>
      </div>

      <div className="flex" style={{ margin: "1rem 0" }}>
        <button className="button" onClick={() => setView("menus")}>เมนู</button>
        <button className="button" onClick={() => setView("orders")}>ออเดอร์ร้าน</button>
      </div>

      {/* ---------------- MENU VIEW ---------------- */}
      {view === "menus" && (
        <div className="flex" style={{ flexWrap: "wrap" }}>
          {menus.map(m => (
            <div key={m.item_id} className="card" style={{ width: 220, margin: 10, cursor: "pointer" }}
                 onClick={() => openEditMenuModal(m)}>
              <img src={m.item_image || LOGO_CHATRAMUE} style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <h4>{m.item_name}</h4>
              <p>{m.item_price} บาท</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- ORDER VIEW ---------------- */}
      {view === "orders" && (
        <div>
          <h3>ออเดอร์ของร้าน</h3>
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b># {order.order_id}</b>
                <button className="button" onClick={() => toggleExpandOrder(order.order_id)}>
                  {expandedOrders[order.order_id] ? "ซ่อน" : "แสดง"}
                </button>
              </div>

              <select
                className="input"
                value={order.status}
                onChange={(e) => handleChangeOrderStatus(order.order_id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Delivering">Delivering</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {expandedOrders[order.order_id] && (
                <div style={{ marginTop: 10 }}>
                  {orderItems[order.order_id]?.map(it => (
                    <div key={it.order_item_id}>• {it.item_name} x {it.quantity}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------------- MODAL ---------------- */}
      {showMenuModal && (
        <div className="modal-background" onClick={(e) => e.target === e.currentTarget && setShowMenuModal(false)}>
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
              value={menuForm.item_price}
              onChange={(e) => setMenuForm({ ...menuForm, item_price: e.target.value })}
            />

            <label>รายละเอียด:</label>
            <textarea
              className="input"
              value={menuForm.description}
              onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
            />

            <label>เลือกรูปเมนู:</label>
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
                style={{ width: 150, marginTop: 10, borderRadius: 8 }}
              />
            )}

            <label>หรือใส่ URL รูปเอง:</label>
            <input
              className="input"
              value={menuForm.item_image}
              onChange={(e) => setMenuForm({ ...menuForm, item_image: e.target.value })}
            />

            <div style={{ marginTop: 10 }}>
              <button className="button" onClick={saveMenu}>Save</button>

              {editingItem && (
                <button className="button button-danger" onClick={deleteMenu} style={{ marginLeft: 8 }}>
                  Delete
                </button>
              )}

              <button className="button" style={{ marginLeft: 8 }} onClick={() => setShowMenuModal(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
