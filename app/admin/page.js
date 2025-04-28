'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  // ประกาศ state สำหรับเก็บข้อมูลต่างๆ
  const [user, setUser] = useState(null);
  const [view, setView] = useState('stores');
  // stores, selectedStore, storeForm สำหรับจัดการร้านค้า
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeForm, setStoreForm] = useState({ store_name: '', store_phone: '', location: '', store_image: '' });
  // showNewStoreModal สำหรับแสดง modal สร้างร้านค้าใหม่
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isEditMenu, setIsEditMenu] = useState(false);
  const [menuForm, setMenuForm] = useState({ item_name: '', item_price: 0, available: 1, description: '', item_image: '' });
  // orders, orderItems สำหรับจัดการคำสั่งซื้อ
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  // users สำหรับจัดการผู้ใช้
  const [users, setUsers] = useState([]);
  // view สำหรับจัดการการแสดงผล
  useEffect(() => {
    // โหลดข้อมูลผู้ใช้จาก localStorage และตรวจสอบสิทธิ์
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/';
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== 'admin') {
      alert('Not admin');
      window.location.href = '/';
      return;
    }
    setUser(u);
    // โหลดข้อมูลร้านค้า, คำสั่งซื้อ, และผู้ใช้จาก API
    fetch('/api/stores').then(res => res.json()).then(data => { if (!data.error) setStores(data); });
    fetch('/api/orders').then(res => res.json()).then(data => { if (!data.error) setOrders(data); });
    fetch('/api/users').then(res => res.json()).then(data => { if (!data.error) setUsers(data); });
  }, []);
  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงข้อมูลร้านค้า
  const handleSelectStore = (st) => {
    setSelectedStore(st);
    setStoreForm({
      store_id: st.store_id,
      store_name: st.store_name,
      store_phone: st.store_phone,
      location: st.location,
      store_image: st.store_image || '',
    });
    // โหลดเมนูของร้านค้านั้นๆ
    fetch(`/api/menu_items?store_id=${st.store_id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMenuItems(d); });
  };
  // ฟังก์ชันสำหรับสร้างร้านค้าใหม่
  const handleNewStore = () => {
    setStoreForm({ store_name: '', store_phone: '', location: '', store_image: '' });
    setShowNewStoreModal(true);
  };
  // ฟังก์ชันสำหรับบันทึกร้านค้า
  const handleSaveStore = async () => {
    try {
      const method = storeForm.store_id ? 'PUT' : 'POST';
      const res = await fetch('/api/stores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm)
      });
      const data = await res.json();
      if (!data.error) {
        alert(storeForm.store_id ? 'Updated store' : 'Created new store');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };
  // ฟังก์ชันสำหรับลบร้านค้า
  const handleDeleteStore = async () => {
    if (!selectedStore) return;
    if (!confirm('คุณแน่ใจว่าต้องการลบร้านค้านี้?')) return;
    try {
      const res = await fetch(`/api/stores?store_id=${selectedStore.store_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        alert('Deleted store');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };
  // ฟังก์ชันสำหรับเปิด modal สำหรับสร้างเมนูใหม่
  const openNewMenuModal = () => {
    setIsEditMenu(false);
    setMenuForm({ item_name: '', item_price: 0, available: 1, description: '', item_image: '' });
    setShowMenuModal(true);
  };
  // ฟังก์ชันสำหรับเปิด modal สำหรับแก้ไขเมนู
  const openEditMenuModal = (m) => {
    setIsEditMenu(true);
    setMenuForm({ ...m });
    setShowMenuModal(true);
  };
  // ฟังก์ชันสำหรับปิด modal สำหรับเมนู
  const closeMenuModal = () => setShowMenuModal(false);
  // ฟังก์ชันสำหรับบันทึกเมนู
  const handleSaveMenu = async () => {
    if (!selectedStore) return;
    try {
      const url = '/api/menu_items';
      const method = isEditMenu ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menuForm,
          store_id: selectedStore.store_id,
          item_price: Number(menuForm.item_price)
        })
      });
      const data = await res.json();
      if (!data.error) {
        alert(isEditMenu ? 'Updated menu' : 'Created menu');
        closeMenuModal();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };
  // ฟังก์ชันสำหรับลบเมนู
  const handleDeleteMenu = async () => {
    if (!menuForm.item_id) return;
    if (!confirm('ต้องการลบเมนูนี้หรือไม่?')) return;
    try {
      const res = await fetch(`/api/menu_items?item_id=${menuForm.item_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        alert('Deleted menu');
        closeMenuModal();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };
  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงสถานะคำสั่งซื้อ
  const toggleExpandOrder = async (order_id) => {
    if (expandedOrders[order_id]) {
      setExpandedOrders(prev => ({ ...prev, [order_id]: false }));
    } else {
      if (!orderItems[order_id]) {
        const res = await fetch(`/api/order_items?order_id=${order_id}`);
        const data = await res.json();
        if (!data.error) {
          setOrderItems(prev => ({ ...prev, [order_id]: data }));
        }
      }
      setExpandedOrders(prev => ({ ...prev, [order_id]: true }));
    }
  };
  // ฟังก์ชันสำหรับเปลี่ยนสถานะคำสั่งซื้อ
  const handleChangeOrderStatus = async (order_id, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id, status: newStatus })
      });
      const data = await res.json();
      if (!data.error) {
        setOrders(prev => prev.map(o => o.order_id === order_id ? { ...o, status: newStatus } : o));
        alert('เปลี่ยนสถานะสำเร็จ');
      }
    } catch (err) {
      console.error(err);
    }
  };
  // ฟังก์ชันสำหรับลบผู้ใช้
  const handleDeleteUser = async (user_id, role) => {
    if (role === 'admin') {
      alert('ไม่สามารถลบ Admin ได้');
      return;
    }
    if (!confirm('คุณแน่ใจว่าต้องการลบ user นี้?')) return;
    try {
      const res = await fetch(`/api/users?user_id=${user_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        alert('Deleted user');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (!user) return null; // ถ้าไม่มี user ให้ redirect ไปหน้าแรก
    
  return (
    <div className="container">
      <h1>Admin Panel</h1>

      <div className="flex" style={{ marginBottom: '1rem' }}>
        <button className="button" onClick={() => setView('stores')}>ร้านค้า/เมนู</button>
        <button className="button" onClick={() => setView('orders')}>Orders</button>
        <button className="button" onClick={() => setView('users')}>Users</button>
      </div>
      
      {view === 'stores' && (
        <>
          <button className="button" onClick={handleNewStore}>+ New Store</button>

          <div className="flex" style={{ marginTop: '1rem' }}>
            <div style={{ width: '250px' }}>
              {stores.map(st => (
                <div
                  key={st.store_id}
                  onClick={() => handleSelectStore(st)}
                  className="card"
                  style={{ cursor: 'pointer', marginBottom: '1rem' }}
                >
                  {st.store_name}
                </div>
              ))}
            </div>

            {selectedStore && (
              <div style={{ flex: 1 }}>
                <h3>Edit Store</h3>

                <label>Store Name:</label>
                <input
                  className="input"
                  placeholder="Store Name"
                  value={storeForm.store_name}
                  onChange={e => setStoreForm({ ...storeForm, store_name: e.target.value })}
                />
                <label>Phone:</label>
                <input
                  className="input"
                  placeholder="Phone"
                  value={storeForm.store_phone}
                  onChange={e => setStoreForm({ ...storeForm, store_phone: e.target.value })}
                />
                <label>Location:</label>
                <input
                  className="input"
                  placeholder="Location"
                  value={storeForm.location}
                  onChange={e => setStoreForm({ ...storeForm, location: e.target.value })}
                />
                <label>Image URL:</label>
                <input
                  className="input"
                  placeholder="Image URL"
                  value={storeForm.store_image}
                  onChange={e => setStoreForm({ ...storeForm, store_image: e.target.value })}
                />

                <div style={{ marginTop: '1rem' }}>
                  <button className="button" onClick={handleSaveStore}>Save</button>
                  <button className="button button-danger" style={{ marginLeft: '8px' }} onClick={handleDeleteStore}>Delete Store</button>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h3>Menus of {selectedStore.store_name}</h3>
                  <button className="button" onClick={openNewMenuModal}>+ New Menu</button>

                  <div className="flex" style={{ marginTop: '1rem' }}>
                    {menuItems.map(m => (
                      <div
                        key={m.item_id}
                        onClick={() => openEditMenuModal(m)}
                        className="card"
                        style={{ width: '200px', cursor: 'pointer' }}
                      >
                        {m.item_name} - {m.item_price} บาท
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
            {/* Modal สำหรับสร้างร้านค้าใหม่ */}
          {showNewStoreModal && (
            <div className="modal-background" onClick={(e) => { if (e.target === e.currentTarget) setShowNewStoreModal(false); }}>
              <div className="modal-content">
                <h3>New Store</h3>

                <input
                  className="input"
                  placeholder="Store Name"
                  value={storeForm.store_name}
                  onChange={(e) => setStoreForm({ ...storeForm, store_name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Phone"
                  value={storeForm.store_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, store_phone: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={storeForm.location}
                  onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Image URL"
                  value={storeForm.store_image}
                  onChange={(e) => setStoreForm({ ...storeForm, store_image: e.target.value })}
                />
          
                <div style={{ marginTop: '1rem' }}>
                  <button className="button" onClick={async () => {
                    await handleSaveStore();
                    setShowNewStoreModal(false); // ปิด modal หลัง save
                  }}>
                    Save
                  </button>
                  <button className="button" style={{ marginLeft: '8px' }} onClick={() => setShowNewStoreModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
            
            {/* Modal สำหรับสร้าง/แก้ไขเมนู */}
          {showMenuModal && (
            <div className="modal-background" onClick={e => { if (e.target === e.currentTarget) closeMenuModal(); }}>
              <div className="modal-content">
                <h3>{isEditMenu ? 'Edit Menu' : 'New Menu'}</h3>
                <input
                  className="input"
                  placeholder="Name"
                  value={menuForm.item_name}
                  onChange={e => setMenuForm({ ...menuForm, item_name: e.target.value })}
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Price"
                  value={menuForm.item_price}
                 onChange={e => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setMenuForm({ ...menuForm, item_price: value });
                    }
                  }}
                />

                <textarea
                  className="input"
                  placeholder="Description"
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Image URL"
                  value={menuForm.item_image}
                  onChange={e => setMenuForm({ ...menuForm, item_image: e.target.value })}
                />

                <div style={{ marginTop: '1rem' }}>
                  <button className="button" onClick={handleSaveMenu}>{isEditMenu ? 'Save Menu' : 'Create Menu'}</button>
                  {isEditMenu && (
                    <button className="button button-danger" style={{ marginLeft: '8px' }} onClick={handleDeleteMenu}>
                      Delete Menu
                    </button>
                  )}
                  <button className="button" style={{ marginLeft: '8px' }} onClick={closeMenuModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'orders' && (
        <div>
          <h2>All Orders</h2>
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ marginBottom: '1rem' }}>
              <div>
                <b>Order #{order.order_id}</b> (User: {order.user_id}) 
                <button className="button" style={{ marginLeft: '8px' }} onClick={() => toggleExpandOrder(order.order_id)}>
                  {expandedOrders[order.order_id] ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <label>Status:</label>
                <select
                  value={order.status}
                  onChange={(e) => handleChangeOrderStatus(order.order_id, e.target.value)}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Delivering">Delivering</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <div>Total: {order.total_price} บาท</div>
                <div>Delivery: {order.delivery_fee} บาท, Discount: {order.discount} บาท</div>
                <div>
                  Order time: {new Date(order.order_time).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              </div>

              {expandedOrders[order.order_id] && (
                <div style={{ marginTop: '1rem', background: '#f9f9f9', padding: '0.5rem', borderRadius: '6px' }}>
                  <b>Order Items</b>
                  {orderItems[order.order_id] ? orderItems[order.order_id].map(item => (
                    <div key={item.order_item_id} style={{ marginBottom: '0.5rem' }}>
                      <div>Menu: {item.item_name}</div>
                      <div>Quantity: {item.quantity}</div>
                      <div>Item price: {item.item_price} บาท</div>
                      <div>Subtotal: {item.quantity * item.item_price} บาท</div>
                    </div>
                  )) : (
                    <p>Loading...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'users' && (
        <div>
          <h2>All Users</h2>
          {users.map(u => (
            <div key={u.user_id} className="card" style={{ marginBottom: '1rem' }}>
              <p>ID: {u.user_id}</p>
              <p>Username: {u.username}</p>
              <p>First name: {u.fname}</p>
              <p>Last name: {u.lname}</p>
              <p>E-mail: {u.email}</p>
              <p>Phone: {u.user_phone}</p>
              <p>Address: {u.user_address}</p>
              <p>Type: {u.user_type}</p>
              <p>Role: {u.role}</p>
              {u.role !== 'admin' && (
                <button className="button button-danger" onClick={() => handleDeleteUser(u.user_id, u.role)}>Delete</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
