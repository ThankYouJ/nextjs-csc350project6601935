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
  const [tokenBalance, setTokenBalance] = useState(0); // ยอดเหรียญที่มี
  const [useTokenAmount, setUseTokenAmount] = useState(''); // จำนวนที่ต้องการใช้
  const [tokenDiscount, setTokenDiscount] = useState(0); // มูลค่าส่วนลดจาก Token

  // ราคาสุทธิ
  const [finalTotal, setFinalTotal] = useState(0);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBillCode, setCreatedBillCode] = useState('');

  useEffect(() => {
    // 1. โหลด User & Items
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

    // 2. คำนวณราคาพื้นฐาน
    const sum = items.reduce((acc, it) => acc + (it.item_price * it.quantity), 0);
    setTotalPrice(sum);

    // 3. คำนวณ VIP Discount & Delivery
    let delivery = 20;
    let vipDisc = 0;

    if (parsedUser.user_type === 'vip') {
      delivery = 0;
      vipDisc = sum * 0.20; // ลด 20%
    }
    setDeliveryFee(delivery);
    setVipDiscount(vipDisc);

    // 4. เช็ค Wallet เพื่อดึงยอดเหรียญ
    checkWalletTokenBalance();

  }, []);

  // คำนวณ Final Total ทุกครั้งที่มีการเปลี่ยนแปลงค่าต่างๆ
  useEffect(() => {
    const total = totalPrice + deliveryFee - vipDiscount - tokenDiscount;
    setFinalTotal(total > 0 ? total : 0); // ห้ามติดลบ
  }, [totalPrice, deliveryFee, vipDiscount, tokenDiscount]);

  const checkWalletTokenBalance = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWalletAddress(address);

          // ดึงยอดเหรียญจาก Contract
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

    // Validation: ห้ามใช้เกินที่มี และ ห้ามเกินยอดที่ต้องจ่าย (หลังจากหัก VIP แล้ว)
    const maxPayable = totalPrice + deliveryFee - vipDiscount;
    
    if (amount > tokenBalance) {
      alert("ยอดเหรียญของคุณไม่พอ");
      setTokenDiscount(0);
      setUseTokenAmount('');
    } else if (amount > maxPayable) {
      alert("คุณใช้เหรียญเกินราคาสินค้าไม่ได้");
      setTokenDiscount(maxPayable); // ให้ใช้ได้สูงสุดเท่าราคาของ
      setUseTokenAmount(maxPayable.toString());
    } else {
      setTokenDiscount(amount); // Rate 1 Token = 1 Baht
    }
  };

  const handleConfirm = async () => {
    // ถ้ามีการใช้ Token ต้องโอนเหรียญกลับคืนร้านค้า (Burn หรือ Transfer to Admin)
    if (tokenDiscount > 0) {
        if (!window.ethereum) return alert("กรุณาติดตั้ง MetaMask เพื่อใช้เหรียญ");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // โอนเหรียญไปยัง Admin Wallet (หรือ Address ร้านค้า)
            // สมมติว่าโอนกลับไปที่ Deployer/Admin (ต้องแก้เป็น Address จริงของร้าน)
            const SHOP_WALLET = "0xe080bbfc9c7545421b0c3d3d13a820c853013302"; 
            
            const tx = await contract.transfer(SHOP_WALLET, ethers.parseEther(tokenDiscount.toString()));
            await tx.wait(); // รอจนโอนสำเร็จ
            
        } catch (err) {
            console.error(err);
            alert("การจ่ายเหรียญล้มเหลว: " + (err.reason || err.message));
            return; // หยุดการทำงาน ไม่บันทึก Order
        }
    }

    // บันทึก Order ลง Database
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          delivery_fee: deliveryFee,
          discount: vipDiscount + tokenDiscount, // รวมส่วนลดทั้งหมด
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

  return (
    <div className="container">
      <h1>ชำระเงิน</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>รายการอาหาร:</h3>
        {selectedItems.map((it, idx) => (
          <div key={idx}>
            {it.item_name} x {it.quantity} = {(it.item_price * it.quantity).toFixed(2)} บาท
          </div>
        ))}
      </div>

      {/* ส่วนลด RSU Token */}
      <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f0f8ff' }}>
        <h3>ใช้ RSU Token ลดราคา (1 Token = 1 บาท)</h3>
        {walletAddress ? (
            <div>
                <p>Wallet: {walletAddress.substring(0,6)}...{walletAddress.substring(38)}</p>
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

      <div className="card" style={{ marginBottom: '1rem' }}>
        <p>รวมราคาอาหาร: {totalPrice.toFixed(2)} บาท</p>
        <p>ค่าส่ง: {deliveryFee.toFixed(2)} บาท</p>
        <p style={{ color: 'green' }}>ส่วนลด VIP: -{vipDiscount.toFixed(2)} บาท</p>
        <p style={{ color: 'blue' }}>ส่วนลด Token: -{tokenDiscount.toFixed(2)} บาท</p>
        <hr/>
        <h3>รวมทั้งสิ้น: {finalTotal.toFixed(2)} บาท</h3>
      </div>

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
        <div className="modal-background" style={{zIndex: 2000}}>
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