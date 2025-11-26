'use client';

import { useEffect, useState } from 'react';
import ConnectWalletButton from '../components/ConnectWalletButton';
import { useWallet } from '../WalletProvider';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/contractConfig';

const LOGO_DEFAULT = 'https://via.placeholder.com/150?text=No+Image';

export default function MerchantPage() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [menus, setMenus] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Menu
  const [menuForm, setMenuForm] = useState({ item_name: '', item_price: 0, available: 1, description: '', item_image: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // View Tabs
  const [view, setView] = useState("menus");

  // Orders
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Wallet
  const { address, isConnected } = useWallet();
  const [savingWallet, setSavingWallet] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState("");

  // Cash Out
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [burning, setBurning] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');

  // PROMOTIONS
const [promotions, setPromotions] = useState([]);
const [showPromoModal, setShowPromoModal] = useState(false);
const [editingPromo, setEditingPromo] = useState(null);


const [promoForm, setPromoForm] = useState({
  title: "",
  description: "",
  token_cost: 0,
  image_url: "",
  discount_type: "PERCENT",
  discount_value: 0,
  max_discount: 0,
  applies_to: "ORDER",
  item_id: null,
  min_order_amount: 0,
  is_active: 1,
});


  // Upload image
  async function uploadToImgBB(file) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_KEY;
      if (!apiKey) return alert("Missing NEXT_PUBLIC_IMGBB_KEY"), null;
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (err) { return null; }
  }

  // Initial Load
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { window.location.href = "/"; return; }
    const u = JSON.parse(stored);
    setUser(u);

    fetch(`/api/stores?user_id=${u.user_id}`)
      .then(res => res.json())
      .then(data => {
        let myStore = null;
        if (Array.isArray(data)) { if (data.length > 0) myStore = data[0]; } 
        else if (data.store_id) { myStore = data; }

        if (!myStore) { setStore(null); return; }
        setStore(myStore);
        setCurrentWalletAddress(myStore.MERCHANT_ADDRESS || "");

        fetch(`/api/menu_items?store_id=${myStore.store_id}`).then(r => r.json()).then(m => setMenus(m));
        fetch(`/api/orders?store_id=${myStore.store_id}`).then(r => r.json()).then(o => setOrders(o || []));
        fetch(`/api/promotions?store_id=${myStore.store_id}`)
          .then(r => r.json())
          .then(p => {
            setPromotions(Array.isArray(p) ? p : []);
          });

      });
  }, []);

  // Wallet balance
  useEffect(() => {
    if (isConnected && address) fetchTokenBalance(address);
  }, [isConnected, address]);

  const fetchTokenBalance = async (walletAddr) => {
    if (!window.ethereum) return;
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const balance = await contract.balanceOf(walletAddr);
        setTokenBalance(ethers.formatEther(balance));
    } catch (err) { console.error(err); }
  };

  // Cash out
  const handleCashOut = async () => {
    if (!cashOutAmount || parseFloat(cashOutAmount) <= 0) return alert("กรุณากรอกจำนวน Token ที่ถูกต้อง");
    if (!window.ethereum) return alert("กรุณาติดตั้ง MetaMask");
    if(!confirm(`ต้องการแลก ${cashOutAmount} Tokens เป็นเงิน ${cashOutAmount} บาท ?`)) return;

    setBurning(true);
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const amountWei = ethers.parseEther(cashOutAmount.toString());
        const tx = await contract.redeem(amountWei);
        await tx.wait();

        alert(`รับเงินแล้ว: ${cashOutAmount} บาท`);
        setCashOutAmount('');
        fetchTokenBalance(address);
    } catch (err) {
        alert("เกิดข้อผิดพลาด: " + (err.reason || err.message));
    } finally { setBurning(false); }
  };

  // Save wallet address
  const saveWalletAddress = async () => {
    if (!isConnected || !address) return alert("กรุณา Connect Wallet ก่อน");
    setSavingWallet(true);
    const res = await fetch("/api/stores/wallet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.store_id, merchantAddress: address }),
    });
    setSavingWallet(false);
    if (res.ok) { alert("บันทึกสำเร็จ"); setCurrentWalletAddress(address); }
  };

  // Menu modal
  const openNewMenuModal = () => {
    setEditingItem(null);
    setMenuForm({ item_name: '', item_price: 0, available: 1, description: '', item_image: '' });
    setShowMenuModal(true);
  };

  const openEditMenuModal = (item) => {
    setEditingItem(item);
    setMenuForm({ ...item });
    setShowMenuModal(true);
  };

  const saveMenu = async () => {
    const method = editingItem ? "PUT" : "POST";
    const payload = { ...menuForm, item_price: Number(menuForm.item_price), store_id: store.store_id };
    if (editingItem) payload.item_id = editingItem.item_id;

    const res = await fetch("/api/menu_items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.error) { alert("บันทึกสำเร็จ"); window.location.reload(); }
  };

  const deleteMenu = async () => {
    if (!editingItem || !confirm("ลบเมนูนี้?")) return;
    await fetch(`/api/menu_items?item_id=${editingItem.item_id}`, { method:"DELETE" });
    alert("ลบแล้ว"); window.location.reload();
  };

  // Orders
  const toggleExpandOrder = async (order_id) => {
    if (expandedOrders[order_id]) {
      setExpandedOrders(prev => ({ ...prev, [order_id]: false }));
    } 
    else {
      const data = await fetch(`/api/order_items?order_id=${order_id}`).then(r=>r.json());
      setOrderItems(prev => ({ ...prev, [order_id]: data }));
      setExpandedOrders(prev => ({ ...prev, [order_id]: true }));
    }
  };

  const handleChangeOrderStatus = async (order_id, newStatus) => {
    await fetch("/api/orders", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ order_id, status:newStatus })
    });

    setOrders(prev =>
      prev.map(o => o.order_id === order_id ? { ...o, status:newStatus } : o)
    );
  };
  // ----- Promotions: CRUD on frontend -----
  const openNewPromoModal = () => {
    setEditingPromo(null);
    setPromoForm({
      title: "",
      description: "",
      token_cost: 0,
      image_url: "/mnt/data/2dd478e3-ddd2-464f-aa83-8952402b1a72.png", // default example image
      discount_type: "PERCENT",
      discount_value: 0,
      max_discount: 0,
      applies_to: "ORDER",
      item_id: null,
      min_order_amount: 0,
    });
    setShowPromoModal(true);
  };

  const savePromotion = async () => {
  if (!promoForm.title) return alert("กรุณากรอกชื่อโปรโมชัน");

  try {
    const method = editingPromo ? "PUT" : "POST";
    const url = editingPromo
      ? `/api/promotions/${editingPromo.promotion_id}`
      : `/api/promotions`;

    // don't override store_id on update
    const body = {
      ...promoForm,
      item_id: promoForm.applies_to === "ITEM" ? promoForm.item_id : null,
    };

    if (!editingPromo) {
      if (!store || !store.store_id) {
        return alert("Store ยังไม่โหลด");
      }
      body.store_id = store.store_id;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert("บันทึกไม่สำเร็จ: " + (j.error || j.message || res.status));
    }

    alert(editingPromo ? "แก้ไขโปรสำเร็จ" : "เพิ่มโปรสำเร็จ");
    setShowPromoModal(false);

    // refresh
    const p = await fetch(`/api/promotions?store_id=${store.store_id}`).then(r => r.json());
    setPromotions(p || []);

  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาด");
  }
};

  const deletePromotion = async (promotion_id) => {
    if (!confirm("ต้องการลบโปรนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/promotions/${promotion_id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        return alert("ลบไม่สำเร็จ: " + (j.error || res.status));
      }
      setPromotions(prev => prev.filter(p => p.promotion_id !== promotion_id));
      alert("ลบโปรสำเร็จ");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };


  // helper: upload image for promo (calls existing uploadToImgBB)
  const handlePromoImageUpload = async (file) => {
    const url = await uploadToImgBB(file);
    if (url) setPromoForm(prev => ({ ...prev, image_url: url }));
  };

  // -----------------------
  // Render
  // -----------------------
  if (!user || !store) return <div className="container" style={{textAlign:'center', padding:'50px'}}>Loading...</div>;

  return (
    <div className="container">
      <h1>Merchant Panel</h1>

      {/* Header card */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {store.store_image && <img src={store.store_image} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />}
          <div>
            <h2 style={{ margin: 0 }}>ร้าน: {store.store_name}</h2>
            <p style={{ margin: 0, color: '#666' }}>{store.location}</p>
          </div>
        </div>
        <button className="button" style={{ backgroundColor: '#4A56E2', color: 'white' }} onClick={() => setShowWalletModal(true)}>ตั้งค่า Wallet</button>
      </div>

      {/* Cash Out card */}
      <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <h3 style={{ margin: 0, color: '#0d47a1' }}>💰 Cash Out (แลกเหรียญเป็นเงิน)</h3>
            <div style={{fontSize:'0.9rem', color:'#0d47a1', fontWeight:'bold', background:'rgba(255,255,255,0.5)', padding:'4px 8px', borderRadius:'4px'}}>
                Balance: {parseFloat(tokenBalance).toFixed(2)} RSU
            </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>จำนวน Token:</label>
                <div style={{display:'flex', alignItems:'center'}}>
                    <input 
                        type="number" 
                        className="input" 
                        style={{ marginTop: '5px', marginBottom: 0, flex:1 }}
                        placeholder="0.00"
                        value={cashOutAmount}
                        onChange={(e) => setCashOutAmount(e.target.value)}
                    />
                    <button 
                        onClick={() => setCashOutAmount(tokenBalance)}
                        style={{marginLeft:'5px', fontSize:'0.8rem', background:'transparent', border:'1px solid #0d47a1', color:'#0d47a1', borderRadius:'4px', cursor:'pointer'}}
                    >
                        Max
                    </button>
                </div>
            </div>
            <button 
                className="button" 
                style={{ backgroundColor: burning ? '#ccc' : '#1976d2', color: 'white', minWidth: '120px' }}
                onClick={handleCashOut}
                disabled={burning}
            >
                {burning ? 'Processing...' : 'รับเงิน'}
            </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex" style={{ margin: "1rem 0", gap: '10px' }}>
        <button className="button" onClick={() => setView("menus")} style={{ backgroundColor: view === 'menus' ? '#0070f3' : '#ccc' }}>จัดการเมนู</button>
        <button className="button" onClick={() => setView("orders")} style={{ backgroundColor: view === 'orders' ? '#0070f3' : '#ccc' }}>รายการออเดอร์</button>
        <button className="button" onClick={() => setView("promotions")} style={{ backgroundColor: view === 'promotions' ? '#0070f3' : '#ccc' }}>โปรโมชัน</button>
      </div>

      {/* Menus View */}
      {view === "menus" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button className="button" onClick={openNewMenuModal} style={{ backgroundColor: '#28a745' }}>+ เพิ่มเมนูใหม่</button>
          </div>
          <div className="flex" style={{ flexWrap: "wrap" }}>
            {menus.map(m => (
              <div key={m.item_id} className="card" style={{ width: 220, margin: 10, cursor: "pointer", padding: 0, overflow: 'hidden' }} onClick={() => openEditMenuModal(m)}>
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

      {/* Orders View */}
      {view === "orders" && (
        <div>
          <h3>ออเดอร์ของร้าน</h3>
          {orders.length === 0 && <p>ยังไม่มีออเดอร์</p>}
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                <div>
                  <b>Order #{order.order_id}</b>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(order.order_time).toLocaleString('th-TH')}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select className="input" style={{ marginBottom: 0, width: '140px' }} value={order.status} onChange={(e) => handleChangeOrderStatus(order.order_id, e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Delivering">Delivering</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <button className="button" onClick={() => toggleExpandOrder(order.order_id)} style={{ marginTop: 0 }}>{expandedOrders[order.order_id] ? "ซ่อน" : "ดูรายการ"}</button>
                </div>
              </div>
              {expandedOrders[order.order_id] && (
                <div style={{ marginTop: 10, background: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                  {orderItems[order.order_id] ? orderItems[order.order_id].map(it => (
                      <div key={it.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '4px 0' }}>
                        <span>{it.item_name} x {it.quantity}</span><span>{(it.item_price * it.quantity).toFixed(2)}</span>
                      </div>
                  )) : <span>กำลังโหลด...</span>}
                  <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>รวม: {order.total_price} บาท</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Promotions View */}
      {view === "promotions" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button className="button" style={{ backgroundColor: '#4A56E2' }} onClick={openNewPromoModal}>
              + เพิ่มโปรโมชัน
            </button>
          </div>

          <div className="flex" style={{ flexWrap: "wrap" }}>
            {promotions.length === 0 && <p>ยังไม่มีโปรโมชั่น</p>}

            {Array.isArray(promotions) && promotions.map(p => {
              const isGlobal = p.store_id === null;

              return (
                <div key={p.promotion_id} className="card" style={{ width: 260, margin: 10, padding: 10, borderRadius: 8 }}>
                  
                  <img 
                    src={p.image_url || "/mnt/data/2dd478e3-ddd2-464f-aa83-8952402b1a72.png"} 
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} 
                  />

                  <h4 style={{ marginTop: 10 }}>{p.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>{p.description}</p>
                  <p><b>Token:</b> {p.token_cost}</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    <b>Type:</b> {p.discount_type} {p.discount_type === "PERCENT" ? `(${p.discount_value}%)` : `(${p.discount_value})`}
                  </p>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {/* ปุ่มแก้ไข */}
                    <button 
                      className="button" 
                      disabled={isGlobal}
                      style={{ flex: 1, opacity: isGlobal ? 0.5 : 1 }}
                      onClick={() => {
                        if (isGlobal) return;
                        setEditingPromo(p);
                        setPromoForm({ ...p });
                        setShowPromoModal(true);
                      }}
                    >
                      แก้ไข
                    </button>

                    {/* ปุ่มลบ */}
                    <button 
                      className="button button-danger"
                      disabled={isGlobal}
                      style={{ flex: 1, opacity: isGlobal ? 0.5 : 1 }}
                      onClick={() => {
                        if (!isGlobal) deletePromotion(p.promotion_id);
                      }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="modal-background" style={{ zIndex: 9999 }} onClick={(e) => e.target === e.currentTarget && setShowWalletModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3>ตั้งค่า Wallet Address</h3>
            <ConnectWalletButton />
            {isConnected && <p style={{ marginTop: 10 }}><b>Connected Wallet:</b> {address}</p>}
            <p style={{ marginTop: 10 }}><b>Address ที่บันทึกในระบบ:</b> {currentWalletAddress || "ยังไม่มีข้อมูล"}</p>
            {isConnected && currentWalletAddress !== address && (
              <>
                <p style={{ color: '#d97706', marginTop: 10 }}>⚠ Wallet เปลี่ยนไป กรุณากดบันทึก</p>
                <button className="button" onClick={saveWalletAddress} style={{ backgroundColor: '#28a745', marginTop: 10 }}>{savingWallet ? "Saving..." : "Save Wallet Address"}</button>
              </>
            )}
            {isConnected && currentWalletAddress === address && currentWalletAddress && <p style={{ color: '#16a34a', marginTop: 10 }}>✔ Address ในระบบอัปเดตแล้ว</p>}
            {currentWalletAddress && <button className="button button-danger" onClick={async () => {
                  if (!confirm("ต้องการลบ Address นี้หรือไม่?")) return;
                  const res = await fetch(`/api/stores/wallet?store_id=${store.store_id}`, { method: 'DELETE' });
                  if (res.ok) { alert("ลบ Address เรียบร้อย"); setCurrentWalletAddress(""); } else { alert("ลบไม่สำเร็จ"); }
                }} style={{ marginTop: 15 }}>Remove Address</button>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="button" style={{ backgroundColor: '#6c757d' }} onClick={() => setShowWalletModal(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="modal-background" style={{ zIndex: 9999 }} onClick={(e) => e.target === e.currentTarget && setShowMenuModal(false)}>
          <div className="modal-content">
            <h3>{editingItem ? "แก้ไขเมนู" : "เมนูใหม่"}</h3>
            <label>ชื่อเมนู:</label><input className="input" value={menuForm.item_name} onChange={(e) => setMenuForm({ ...menuForm, item_name: e.target.value })} />
            <label>ราคา:</label><input className="input" type="number" value={menuForm.item_price} onChange={(e) => setMenuForm({ ...menuForm, item_price: e.target.value })} />
            <label>รายละเอียด:</label><textarea className="input" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
            <label>เลือกรูปเมนู:</label>
            <input type="file" accept="image/*" className="input" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const url = await uploadToImgBB(file); if (url) setMenuForm({ ...menuForm, item_image: url });
            }} />
            {menuForm.item_image && <img src={menuForm.item_image} alt="preview" style={{ width: 150, marginTop: 10, borderRadius: 8 }} />}
            <label>หรือใส่ URL:</label><input className="input" value={menuForm.item_image} onChange={(e) => setMenuForm({ ...menuForm, item_image: e.target.value })} />
            <div style={{ marginTop: 10 }}>
              <button className="button" onClick={saveMenu}>Save</button>
              {editingItem && <button className="button button-danger" onClick={deleteMenu} style={{ marginLeft: 8 }}>Delete</button>}
              <button className="button" style={{ marginLeft: 8 }} onClick={() => setShowMenuModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showPromoModal && (
        <div className="modal-background" style={{ zIndex: 9999 }} onClick={(e) => e.target === e.currentTarget && setShowPromoModal(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h3>{editingPromo ? "แก้ไขโปรโมชัน" : "เพิ่มโปรโมชันใหม่"}</h3>

            <label>ชื่อโปร:</label>
            <input className="input" value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} />

            <label>รายละเอียด:</label>
            <textarea className="input" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} />

            <label>Token ที่ใช้แลก:</label>
            <input className="input" type="number" value={promoForm.token_cost} onChange={(e) => setPromoForm({ ...promoForm, token_cost: e.target.value })} />

            <label>ประเภทส่วนลด:</label>
            <select className="input" value={promoForm.discount_type} onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}>
              <option value="PERCENT">เปอร์เซ็นต์</option>
              <option value="FIXED">จำนวนเงิน</option>
            </select>

            <label>จำนวนส่วนลด:</label>
            <input className="input" type="number" value={promoForm.discount_value} onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })} />

            {promoForm.discount_type === "PERCENT" && (
              <>
                <label>ส่วนลดสูงสุด:</label>
                <input className="input" type="number" value={promoForm.max_discount} onChange={(e) => setPromoForm({ ...promoForm, max_discount: e.target.value })} />
              </>
            )}

            <label>ใช้กับ:</label>
            <select className="input" value={promoForm.applies_to} onChange={(e) => setPromoForm({ ...promoForm, applies_to: e.target.value })}>
              <option value="ORDER">ทั้งออเดอร์</option>
              <option value="ITEM">เฉพาะสินค้า</option>
            </select>

            {promoForm.applies_to === "ITEM" && (
              <>
                <label>เลือกสินค้า:</label>
                <select className="input" value={promoForm.item_id || ""} onChange={(e) => setPromoForm({ ...promoForm, item_id: e.target.value })}>
                  <option value="">-- เลือกสินค้า --</option>
                  {menus.map(m => <option key={m.item_id} value={m.item_id}>{m.item_name}</option>)}
                </select>
              </>
            )}

            <label>ยอดขั้นต่ำ:</label>
            <input className="input" type="number" value={promoForm.min_order_amount} onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: e.target.value })} />

            <label>รูปโปรโมชัน (URL หรือ Upload):</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="input" value={promoForm.image_url} onChange={(e) => setPromoForm({ ...promoForm, image_url: e.target.value })} />
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                await handlePromoImageUpload(file);
              }} />
            </div>
           
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="button" onClick={savePromotion}>Save</button>
              <button className="button" style={{ background: '#6c757d' }} onClick={() => setShowPromoModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
