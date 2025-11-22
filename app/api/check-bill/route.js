import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { bill_code } = body;

    if (!bill_code) {
      return NextResponse.json(
        { valid: false, reason: "MISSING_BILL_CODE" },
        { status: 400 }
      );
    }

    // ใช้ MYSQL_URI จาก .env โดยตรง
    const connection = await mysql.createConnection(process.env.MYSQL_URI);

    const [rows] = await connection.execute(
      "SELECT is_redeemed FROM orders WHERE bill_code = ?",
      [bill_code]
    );

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, reason: "NOT_FOUND" });
    }

    const is_redeemed = rows[0].is_redeemed === 1;

    if (is_redeemed) {
      return NextResponse.json({
        valid: false,
        reason: "ALREADY_REDEEMED",
      });
    }

    return NextResponse.json({ valid: true, reason: "OK" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { valid: false, message: err.message },
      { status: 500 }
    );
  }
}
