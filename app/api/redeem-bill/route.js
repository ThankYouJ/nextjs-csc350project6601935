import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { bill_code } = body;

    if (!bill_code) {
      return NextResponse.json(
        { success: false, message: "Missing bill_code" },
        { status: 400 }
      );
    }

    // ใช้ MYSQL_URI แทน DB_HOST + DB_USER + DB_PASS
    const connection = await mysql.createConnection(process.env.MYSQL_URI);

    // 1) ตรวจว่าบิลมีอยู่ไหม
    const [bill] = await connection.execute(
      "SELECT is_redeemed FROM orders WHERE bill_code = ?",
      [bill_code]
    );

    if (bill.length === 0) {
      return NextResponse.json({ success: false, reason: "NOT FOUND" });
    }

    if (bill[0].is_redeemed) {
      return NextResponse.json({ success: false, reason: "ALREADY REDEEMED" });
    }

    // 2) Redeem บิลจริง
    await connection.execute(
      "UPDATE orders SET is_redeemed = TRUE, redeemed_at = NOW() WHERE bill_code = ?",
      [bill_code]
    );

    return NextResponse.json({ success: true, reason: "REDEEM SUCCESS" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
