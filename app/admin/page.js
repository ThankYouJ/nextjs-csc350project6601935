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

      window.location.href = '/';
      alert('Not admin');
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

  //Manage Token
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenTxHash, setTokenTxHash] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [tokenTxs, setTokenTxs] = useState([]);

  // Transactions from blockchain
  const [allTxs, setAllTxs] = useState([]);

  const loadTokenTxs = async () => {
    try {
      const res = await fetch('/api/token/txs');
      const data = await res.json();
      if (!data.error && Array.isArray(data.txs)) {
        setTokenTxs((prev) => {
          // merge new list with existing local ones, but avoid dup hashes
          const byHash = new Map();
          [...prev, ...data.txs].forEach((tx) => {
            if (!tx.hash) return;
            if (!byHash.has(tx.hash)) byHash.set(tx.hash, tx);
          });
          return Array.from(byHash.values());
        });
      }
    } catch (err) {
      console.error('Failed to load token txs', err);
    }
  };

  useEffect(() => {
    if (view !== 'token') return;

    // initial load
    loadTokenTxs();

    // poll every 5 seconds
    const id = setInterval(() => {
      loadTokenTxs();
    }, 5000);

    // cleanup when leaving Token tab or unmount
    return () => clearInterval(id);

  }, [view]);

  const tokenRequest = async (payload) => {
    setTokenLoading(true);
    setTokenError('');
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    } finally {
      setTokenLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    const data = await tokenRequest({ action: 'balanceOf', address: tokenAddress });
    if (data.error) {
      setTokenError(data.error);
    } else {
      // use formatted balance from backend
      setTokenBalance(data.balanceFormatted);
    }
  };

  const handleReward = async () => {
    const data = await tokenRequest({
      action: 'reward',
      address: tokenAddress,
      amount: tokenAmount,
    });

    if (data.error) {
      setTokenError(data.error);
    } else {
      setTokenTxHash(data.txHash);
      prependLocalTx('Reward', data.txHash, tokenAddress, tokenAmount);
      // optional immediate refresh too:
      // loadTokenTxs();
    }
  };

  const handleRedeem = async () => {
    const data = await tokenRequest({
      action: 'redeem',
      address: tokenAddress,
      amount: tokenAmount,
    });

    if (data.error) {
      setTokenError(data.error);
    } else {
      setTokenTxHash(data.txHash);
      prependLocalTx('Redeem', data.txHash, tokenAddress, tokenAmount);
      // optional immediate refresh too:
      // loadTokenTxs();
    }
  };

  // Helpers for transaction display
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const txType = (tx) => {
    // local override first
    if (tx.txType) return tx.txType;
    if (tx.from === ZERO_ADDRESS) return 'Reward';
    if (tx.to === ZERO_ADDRESS) return 'Redeem';
    return 'Transfer';
  };

  const txAccentColor = (type) => {
    if (type === 'Reward') return '#e0f7ec';
    if (type === 'Redeem') return '#ffecec';
    return '#f3f3ff';
  };

  const prependLocalTx = (type, hash, address, amount) => {
    const nowSec = Math.floor(Date.now() / 1000);
    setTokenTxs((prev) => [
      {
        hash,
        from: type === 'Reward' ? 'LOCAL_ADMIN' : address,
        to: type === 'Reward' ? address : 'LOCAL_ADMIN',
        valueFormatted: amount.toString(),
        tokenSymbol: 'RSU',
        timeStamp: nowSec,
        txType: type,     // used by txType()
        local: true,      // optional flag, not required
      },
      ...prev,
    ]);
  };

  // Helper for admin management
  const [adminAddress, setAdminAddress] = useState('');
  const [adminCheckResult, setAdminCheckResult] = useState(null); // null | true | false
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(''); // in ETH
  const [adminList, setAdminList] = useState([]);

  const loadAdminList = async () => {
    try {
      const res = await fetch("/api/token/admins");
      const data = await res.json();
      if (!data.error && Array.isArray(data.admins)) {
        setAdminList(data.admins);
      }
    } catch (err) {
      console.error("Failed to load admin list:", err);
    }
  };

  useEffect(() => {
    if (view === "token") {
      loadAdminList();
    }
  }, [view]);

  const handleAddAdmin = async () => {
    if (!adminAddress) {
      alert('Please enter admin wallet address');
      return;
    }

    const data = await tokenRequest({
      action: 'addAdmin',
      address: adminAddress,
    });

    if (data.error) {
      setTokenError(data.error);
    } else {
      setTokenTxHash(data.txHash);
      alert('Admin added successfully');
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminAddress) {
      alert('Please enter admin wallet address');
      return;
    }

    const data = await tokenRequest({
      action: 'removeAdmin',
      address: adminAddress,
    });

    if (data.error) {
      setTokenError(data.error);
    } else {
      setTokenTxHash(data.txHash);
      alert('Admin removed successfully');
    }
  };

  const handleCheckAdmin = async () => {
    if (!adminAddress) {
      alert('Please enter admin wallet address');
      return;
    }

    const data = await tokenRequest({
      action: 'isAdmin',
      address: adminAddress,
    });

    if (data.error) {
      setTokenError(data.error);
      setAdminCheckResult(null);
    } else {
      setAdminCheckResult(data.isAdmin);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) {
      alert('Please enter withdraw wallet and amount');
      return;
    }

    const data = await tokenRequest({
      action: 'withdraw',
      address: withdrawAddress,
      amount: withdrawAmount, // ETH string
    });

    if (data.error) {
      setTokenError(data.error);
    } else {
      setTokenTxHash(data.txHash);
      alert('Withdraw transaction sent');
    }
  };
  // End of helpers

  if (!user) return null; // ถ้าไม่มี user ให้ redirect ไปหน้าแรก



  return (
    <div className="container">
      <h1>Admin Panel</h1>

      <div className="flex" style={{ marginBottom: '1rem' }}>
        <button className="button" onClick={() => setView('stores')}>Store</button>
        <button className="button" onClick={() => setView('orders')}>Orders</button>
        <button className="button" onClick={() => setView('users')}>Users</button>
        <button className="button" onClick={() => setView('token')}>Token</button>
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

              {expandedOrders[order.order_id] && orderItems[order.order_id] && (
                <div style={{ marginTop: '1rem', background: '#f9f9f9', padding: '0.5rem', borderRadius: '6px' }}>
                  <b>Order Items</b>
                  {orderItems[order.order_id].map(item => (
                    <div key={item.order_item_id} style={{ marginBottom: '0.5rem' }}>
                      <div>Menu: {item.item_name}</div>
                      <div>Quantity: {item.quantity}</div>
                      <div>Item price: {item.item_price} บาท</div>
                      <div>Subtotal: {item.quantity * item.item_price} บาท</div>
                    </div>
                  ))}
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

      {view === 'token' && (
        <div>
          <h2>Manage Token</h2>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: '5px' }}>Admin Actions</h3>

            {/* Customer Address */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
              <label
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: '#444',
                }}
              >
                Customer Wallet Address
              </label>

              <input
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  outline: 'none',
                  fontSize: '0.95rem',
                  background: '#fafafa',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.border = '1px solid #888')}
                onBlur={(e) => (e.target.style.border = '1px solid #ddd')}
              />
            </div>

            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
              <label
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: '#444',
                }}
              >
                Amount (RSU)
              </label>

              <input
                placeholder="10.5"
                value={tokenAmount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*\.?\d*$/.test(v)) setTokenAmount(v);
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  outline: 'none',
                  fontSize: '0.95rem',
                  background: '#fafafa',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.border = '1px solid #888')}
                onBlur={(e) => (e.target.style.border = '1px solid #ddd')}
              />
            </div>


            <div style={{ marginTop: '0.5rem' }}>
              <button className="button" disabled={tokenLoading} onClick={handleCheckBalance}>
                Check Balance
              </button>
              <button className="button" style={{ marginLeft: '8px' }} disabled={tokenLoading} onClick={handleReward}>
                Reward
              </button>
              <button className="button button-danger" style={{ marginLeft: '8px' }} disabled={tokenLoading} onClick={handleRedeem}>
                Redeem (From Yourself)
              </button>
            </div>

            {tokenBalance !== null && (
              <p style={{ marginTop: '0.5rem' }}>
                Balance:&nbsp;
                {Number(tokenBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}{" "}
                RSU
              </p>
            )}

            {tokenTxHash && (
              <p style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
                Transaction:&nbsp;
                <a
                  href={`https://eth-sepolia.blockscout.com/tx/${tokenTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tokenTxHash}
                </a>
              </p>
            )}

            {tokenError && (
              <p style={{ marginTop: '0.5rem', color: 'red' }}>
                Error: {tokenError}
              </p>
            )}
          </div>

          {/* --- Admin Management card --- */}
          <div className="card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Admin Management</h3>

            {/* Admin address input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                marginTop: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#444',
                }}
              >
                Admin Wallet Address
              </label>

              <input
                placeholder="0x..."
                value={adminAddress}
                onChange={(e) => {
                  setAdminAddress(e.target.value);
                  setAdminCheckResult(null); // reset when typing
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  outline: 'none',
                  fontSize: '0.95rem',
                  background: '#fafafa',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #888';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.03)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #ddd';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Admin buttons + status */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <button
                className="button"
                style={{ backgroundColor: '#2563eb' }}
                onClick={handleAddAdmin}
              >
                Add Admin
              </button>

              <button
                className="button button-danger"
                onClick={handleRemoveAdmin}
              >
                Remove Admin
              </button>

              <button
                className="button"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#111',
                  border: '1px solid #e5e7eb',
                }}
                onClick={handleCheckAdmin}
              >
                Check Admin Role
              </button>

              {adminCheckResult !== null && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: adminCheckResult ? '#dcfce7' : '#fee2e2',
                    color: adminCheckResult ? '#166534' : '#991b1b',
                    fontWeight: 600,
                  }}
                >
                  {adminCheckResult ? 'Has ADMIN role' : 'Not an admin'}
                </span>
              )}
            </div>

            {/* Withdraw section */}
            <div
              style={{
                borderTop: '1px solid #eee',
                paddingTop: '0.75rem',
                marginTop: '0.25rem',
              }}
            >
              <h4 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Withdraw Contract ETH
              </h4>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  marginBottom: '0.5rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: '#555',
                  }}
                >
                  Destination Wallet
                </label>
                <input
                  placeholder="0x..."
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    background: '#fafafa',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  marginBottom: '0.5rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: '#555',
                  }}
                >
                  Amount (ETH)
                </label>
                <input
                  placeholder="0.05"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*\.?\d*$/.test(v)) setWithdrawAmount(v);
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    background: '#fafafa',
                  }}
                />
              </div>

              <button
                className="button"
                style={{ backgroundColor: '#16a34a' }}
                onClick={handleWithdraw}
              >
                Withdraw
              </button>
            </div>

            {/* Existing withdraw section above */}
            <hr style={{ margin: "1rem 0", border: "0.5px solid #eee" }} />

            <h4 style={{ margin: 0, marginBottom: "0.4rem", fontSize: "0.95rem" }}>
              Current Admins
            </h4>

            <div
              style={{
                background: "#fafafa",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "0.75rem",
                fontSize: "0.85rem",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {adminList.length === 0 ? (
                <div style={{ color: "#777" }}>No admins found</div>
              ) : (
                adminList.map((addr, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.35rem 0",
                      borderBottom: idx < adminList.length - 1 ? "1px solid #eee" : "none",
                      fontFamily: "monospace",
                    }}
                  >
                    <strong>{idx + 1}.</strong> {addr}
                  </div>
                ))
              )}
            </div>

          </div>


          {/* --- Recent Token Transactions card --- */}
          {tokenTxs.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <h3 style={{ margin: 0 }}>Recent Token Transactions</h3>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  Showing latest {Math.min(tokenTxs.length, 10)}
                </span>
              </div>

              {tokenTxs.slice(0, 10).map((tx) => {
                const type = txType(tx);
                const accent = txAccentColor(type);

                return (
                  <div
                    key={tx.hash}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      padding: '0.6rem 0.8rem',
                      marginBottom: '0.5rem',
                      borderRadius: '10px',
                      background: accent,
                    }}
                  >
                    {/* Top row: type + amount */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.1rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: 'rgba(0,0,0,0.04)',
                        }}
                      >
                        {type}
                      </span>

                      <span style={{ fontWeight: 600 }}>
                        {tx.valueFormatted
                          ? Number(tx.valueFormatted).toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })
                          : '-'}{' '}
                        {tx.tokenSymbol || 'RSU'}
                      </span>

                    </div>

                    {/* Middle: from / to */}
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#555',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.1rem',
                      }}
                    >
                      <div>
                        <span style={{ opacity: 0.7 }}>From</span>{' '}
                        <span style={{ fontFamily: 'monospace' }}>{shortAddr(tx.from)}</span>
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>To</span>{' '}
                        <span style={{ fontFamily: 'monospace' }}>{shortAddr(tx.to)}</span>
                      </div>
                    </div>

                    {/* Bottom: time + link */}
                    <div
                      style={{
                        marginTop: '0.15rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: '#777',
                      }}
                    >

                      <span>
                        {tx.timeStamp
                          ? new Date(tx.timeStamp * 1000).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : '-'}
                      </span>

                      <a
                        href={`https://eth-sepolia.blockscout.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 500 }}
                      >
                        View tx ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
