import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, promotion_id, tx_hash } = body;

    if (!user_id || !promotion_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check promotion exists & is active
    const [rows] = await db.query(
      "SELECT token_cost FROM promotions WHERE promotion_id = ? AND is_active = 1",
      [promotion_id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    // Save redeemed promotion
    await db.query(
      "INSERT INTO user_promotions (user_id, promotion_id) VALUES (?, ?)",
      [user_id, promotion_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/promotions/redeem error:", error);
    return NextResponse.json(
      { error: "Redeem failed", detail: String(error) },
      { status: 500 }
    );
  }
}
