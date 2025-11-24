import mysql from "mysql2/promise";
import { NextResponse } from "next/server";
import { ethers } from 'ethers'; 
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/contractConfig'; 

export async function POST(req) {
  try {
    const body = await req.json();
    const { bill_code, wallet_address } = body;

    // ตรวจสอบว่าส่งข้อมูลมาครบไหม
    if (!bill_code || !wallet_address) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ครบถ้วน (Missing bill_code or address)" }, { status: 400 });
    }

    const connection = await mysql.createConnection(process.env.MYSQL_URI);

    // 1. เช็คว่า bill_code นี้มีหรือไม่ และสถานะเป็นอย่างไร
    const [bill] = await connection.execute(
      "SELECT order_id, is_redeemed, total_price FROM orders WHERE bill_code = ?",
      [bill_code]
    );

    // ถ้าไม่มีบิลนี้ในระบบ
    if (bill.length === 0) {
      return NextResponse.json({ success: false, message: "ไม่พบ Bill Code นี้ในระบบ" });
    }

    // 2. เช็ค is_redeemed (0 = ได้, 1 = ไม่ได้)
    if (bill[0].is_redeemed) {
      return NextResponse.json({ success: false, message: "Bill Code นี้ถูกใช้สิทธิ์ไปแล้ว" });
    }

    // --- เริ่มขั้นตอน Blockchain ---
    
    // ใช้ SEPOLIA_RPC_URL ตามที่กำหนด
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) throw new Error("ไม่พบ SEPOLIA_RPC_URL ในไฟล์ .env");

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const merchantWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, merchantWallet);

    // 3. คำนวณรางวัล (Total Price / 10)
    const totalPrice = parseFloat(bill[0].total_price);
    const tokenAmount = totalPrice / 10;
    const tokenAmountWei = ethers.parseEther(tokenAmount.toString());

    console.log(`Process: กำลังโอน ${tokenAmount} Tokens ไปยัง ${wallet_address}`);

    // เรียกฟังก์ชัน reward
    // (ต้องมั่นใจว่า merchantWallet มีสิทธิ์ MERCHANT_ROLE และมี ETH ค่าแก๊สบน Sepolia)
    const tx = await contract.reward(wallet_address, tokenAmountWei);
    await tx.wait(); // รอจน Transaction เสร็จสมบูรณ์

    // --- จบขั้นตอน Blockchain ---

    // 4. บันทึกสถานะและเวลา (redeemed_at) ลง Database
    await connection.execute(
      "UPDATE orders SET is_redeemed = TRUE, redeemed_at = NOW() WHERE bill_code = ?",
      [bill_code]
    );

    return NextResponse.json({ 
      success: true, 
      message: `Redeem สำเร็จ! คุณได้รับ ${tokenAmount} RSU Tokens`, 
      txHash: tx.hash 
    });

  } catch (err) {
    console.error("Redeem Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "เกิดข้อผิดพลาดทางเทคนิค" },
      { status: 500 }
    );
  }
}