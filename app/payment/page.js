'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/contractConfig';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);
  const [user, setUser] = useState(null);

  // การคำนวณราคา
  const [totalPrice, setTotalPrice] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [vipDiscount, setVipDiscount] = useState(0);

  // ส่วนของ RSU Token
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [useTokenAmount, setUseTokenAmount] = useState('');
  const [tokenDiscount, setTokenDiscount] = useState(0);

  // คูปอง
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const [finalTotal, setFinalTotal] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBillCode, setCreatedBillCode] = useState('');

  useEffect(() => {
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

    const sum = items.reduce((acc, it) => acc + (it.item_price * it.quantity), 0);
    setTotalPrice(sum);

    let delivery = 20;
    let vipDisc = 0;

    if (parsedUser.user_type === 'vip') {
      delivery = 0;
      vipDisc = sum * 0.20;
    }
    setDeliveryFee(delivery);
    setVipDiscount(vipDisc);

    checkWalletTokenBalance();

  }, []);

  // ดึงคูปองของ user
  useEffect(() => {
    if (!user) return;

    const fetchCoupons = async () => {
      try {
        const res = await fetch(`/api/users/promotions?user_id=${user.user_id}`);
        if (!res.ok) return;
        const data = await res.json();
        setUserCoupons(data); // คาดว่า data มี field discount_type, discount_value, applies_to, item_id, max_discount, min_order_amount
      } catch (err) {
        console.error('Error fetching user coupons:', err);
      }
    };

    fetchCoupons();
  }, [user]);

  // คำนวณส่วนลดจากคูปองเมื่อเลือกคูปอง / รายการอาหารเปลี่ยน
  useEffect(() => {
    if (!selectedCoupon) {
      setCouponDiscount(0);
      setCouponMessage('');
      return;
    }

    const itemsTotal = selectedItems.reduce(
      (acc, it) => acc + it.item_price * it.quantity,
      0
    );

    // เช็คขั้นต่ำ
    if (
      selectedCoupon.min_order_amount &&
      itemsTotal < Number(selectedCoupon.min_order_amount)
    ) {
      setCouponDiscount(0);
      setCouponMessage(
        `ยอดสั่งซื้อขั้นต่ำสำหรับคูปองนี้คือ ${Number(
          selectedCoupon.min_order_amount
        ).toFixed(2)} บาท`
      );
      return;
    }

    // ฐานสำหรับคิดส่วนลด
    let base = 0;
    if (selectedCoupon.applies_to === 'ITEM' && selectedCoupon.item_id) {
      base = selectedItems
        .filter((it) => it.item_id === selectedCoupon.item_id)
        .reduce((acc, it) => acc + it.item_price * it.quantity, 0);
    } else {
      // ORDER
      base = itemsTotal;
    }

    if (base <= 0) {
      setCouponDiscount(0);
      setCouponMessage('ไม่มีเมนูที่ใช้กับคูปองนี้ในตะกร้า');
      return;
    }

    let discount = 0;
    if (selectedCoupon.discount_type === 'PERCENT') {
      discount = base * (Number(selectedCoupon.discount_value) / 100);
    } else if (selectedCoupon.discount_type === 'FIXED') {
      discount = Number(selectedCoupon.discount_value);
    }

    if (selectedCoupon.max_discount) {
      discount = Math.min(discount, Number(selectedCoupon.max_discount));
    }

    setCouponDiscount(discount);
    setCouponMessage('');
  }, [selectedCoupon, selectedItems, totalPrice]);

  // คำนวณยอดรวมสุดท้าย
  useEffect(() => {
    const total =
      totalPrice + deliveryFee - vipDiscount - tokenDiscount - couponDiscount;
    setFinalTotal(total > 0 ? total : 0);
  }, [totalPrice, deliveryFee, vipDiscount, tokenDiscount, couponDiscount]);

  // ========== WALLET / TOKEN ==========
  const checkWalletTokenBalance = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWalletAddress(address);

          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const balanceWei = await contract.balanceOf(address);
          const balance = parseFloat(ethers.formatEther(balanceWei));
          setTokenBalance(balance);
        }
      } catch (err) {
        console.error("Error checking wallet:", err);
      }
    }
  };

  const handleTokenInputChange = (e) => {
    const val = e.target.value;
    setUseTokenAmount(val);

    const amount = parseFloat(val);
    if (isNaN(amount) || amount < 0) {
      setTokenDiscount(0);
      return;
    }

    const maxPayable = totalPrice + deliveryFee - vipDiscount;

    if (amount > tokenBalance) {
      alert("ยอดเหรียญของคุณไม่พอ");
      setTokenDiscount(0);
      setUseTokenAmount('');
    } else if (amount > maxPayable) {
      alert("คุณใช้เหรียญเกินราคาสินค้าไม่ได้");
      setTokenDiscount(maxPayable);
      setUseTokenAmount(maxPayable.toString());
    } else {
      setTokenDiscount(amount);
    }
  };

  const handleConfirm = async () => {
    if (tokenDiscount > 0) {
      if (!window.ethereum) return alert("กรุณาติดตั้ง MetaMask เพื่อใช้เหรียญ");
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const SHOP_WALLET = "0xe080bbfc9c7545421b0c3d3d13a820c853013302";

        const tx = await contract.transfer(SHOP_WALLET, ethers.parseEther(tokenDiscount.toString()));
        await tx.wait();

      } catch (err) {
        console.error(err);
        alert("การจ่ายเหรียญล้มเหลว: " + (err.reason || err.message));
        return;
      }
    }

    // ดึง store_id จากสินค้าชิ้นแรก (สมมติว่าสั่งร้านเดียวกันหมด)
    const storeId = selectedItems.length > 0 ? selectedItems[0].store_id : null;

    const totalDiscount = vipDiscount + tokenDiscount + couponDiscount;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          store_id: storeId, // ส่ง store_id ไปด้วย
          delivery_fee: deliveryFee,
          discount: totalDiscount,
          coupon_user_promotion_id: selectedCoupon ? selectedCoupon.id : null,
          coupon_discount: couponDiscount,
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
        setCreatedBillCode(data.bill_code);
        setShowSuccessModal(true);
        localStorage.removeItem('selectedItems');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCopyBillCode = () => {
    navigator.clipboard.writeText(createdBillCode);
    alert('คัดลอก Bill Code เรียบร้อย');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  if (!user) return null;

  // หน้า UI
  return (
    <div className="container">
      <h1>ชำระเงิน</h1>

      {/* รายการอาหาร */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>รายการอาหาร:</h3>
        {selectedItems.map((it, idx) => (
          <div key={idx}>
            {it.item_name} x {it.quantity} = {(it.item_price * it.quantity).toFixed(2)} บาท
          </div>
        ))}
      </div>

      {/* คูปอง */}
      <div className="card" style={{ marginBottom: '1rem', background: '#fffaf0' }}>
        <h3>ใช้คูปองส่วนลด</h3>
        {userCoupons.length === 0 ? (
          <p style={{ color: '#777' }}>คุณยังไม่มีคูปองที่ใช้งานได้</p>
        ) : (
          <>
            <select
              className="input"
              style={{ maxWidth: '100%', marginBottom: '0.5rem' }}
              value={selectedCoupon ? selectedCoupon.id : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedCoupon(null);
                  return;
                }
                const c = userCoupons.find(
                  (cp) => cp.id === Number(val)
                );
                setSelectedCoupon(c || null);
              }}
            >
              <option value="">-- ไม่ใช้คูปอง --</option>
              {userCoupons.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.title}
                </option>
              ))}
            </select>

            {selectedCoupon && (
              <div style={{ fontSize: '0.9rem', color: '#444' }}>
                <div>{selectedCoupon.description}</div>
                <div>
                  <br></br>
                  ประเภท:{' '}
                  {selectedCoupon.discount_type === 'PERCENT'
                    ? `${selectedCoupon.discount_value}%`
                    : `ลด ${Number(
                      selectedCoupon.discount_value
                    ).toFixed(2)} บาท`}
                </div>
                {couponMessage ? (
                  <div style={{ color: 'red', marginTop: '4px' }}>
                    {couponMessage}
                  </div>
                ) : (
                  <div style={{ color: 'green', marginTop: '4px' }}>
                    ส่วนลดจากคูปอง: -{couponDiscount.toFixed(2)} บาท
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ใช้ RSU Token */}
      <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f0f8ff' }}>
        <h3>ใช้ RSU Token ลดราคา (1 Token = 1 บาท)</h3>
        {walletAddress ? (
          <div>
            <p>Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</p>
            <p>ยอดคงเหลือ: <b>{tokenBalance} RSU</b></p>
            <div style={{ marginTop: '10px' }}>
              <label>จำนวนที่ต้องการใช้: </label>
              <input
                type="number"
                className="input"
                style={{ width: '150px', marginLeft: '10px' }}
                value={useTokenAmount}
                onChange={handleTokenInputChange}
                placeholder="0"
              />
            </div>
          </div>
        ) : (
          <button className="button" onClick={checkWalletTokenBalance}>
            เชื่อมต่อ Wallet เพื่อใช้เหรียญ
          </button>
        )}
      </div>

      {/* สรุปยอด */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p>รวมราคาอาหาร: {totalPrice.toFixed(2)} บาท</p>
        <p>ค่าส่ง: {deliveryFee.toFixed(2)} บาท</p>
        <p style={{ color: 'green' }}>
          ส่วนลด VIP: -{vipDiscount.toFixed(2)} บาท
        </p>
        <p style={{ color: 'purple' }}>
          ส่วนลดคูปอง: -{couponDiscount.toFixed(2)} บาท
        </p>
        <p style={{ color: 'blue' }}>
          ส่วนลด Token: -{tokenDiscount.toFixed(2)} บาท
        </p>
        <hr />
        <h3>รวมทั้งสิ้น: {finalTotal.toFixed(2)} บาท</h3>
      </div>

      {/* QR */}
      <div className="center" style={{ marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p>QR การชำระเงิน:</p>
          <img
            src="https://i.imgur.com/hYxveJ1.png"
            alt="QR Payment"
            style={{ width: '200px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      <button className="button" onClick={handleConfirm} style={{ width: '100%' }}>
        ยืนยันการชำระเงิน
      </button>

      {showSuccessModal && (
        <div className="modal-background" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2 style={{ color: '#28a745' }}>ชำระเงินเรียบร้อย!</h2>
            <p>ขอบคุณสำหรับการสั่งซื้อ</p>
            <div style={{ background: '#f3f4f6', padding: '1.5rem', margin: '1.5rem 0' }}>
              <p style={{ fontWeight: 'bold' }}>Bill Code ของคุณ:</p>
              <h1 style={{ fontSize: '2rem', wordBreak: 'break-all' }}>{createdBillCode}</h1>
            </div>
            <button className="button" onClick={handleCopyBillCode}>Copy Bill Code</button>
            <button className="button button-danger" style={{ marginLeft: '10px' }} onClick={handleCloseModal}>กลับหน้าแรก</button>
          </div>
        </div>
      )}
    </div>
  );
}