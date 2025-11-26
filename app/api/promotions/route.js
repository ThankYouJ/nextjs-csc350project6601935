// app/api/promotions/route.js
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

/**
 * GET — ดึงโปรโมชั่น
 * รองรับ query:
 * - store_id = 120003 → ดึงของร้านนี้ + global (NULL)
 */
// GET /api/promotions
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store_id");

    let query = `SELECT * FROM promotions WHERE is_active = 1`;
    let params = [];

    // ถ้ามี store_id → ดึงเฉพาะของร้านนั้น
    if (storeId) {
      query = `
        SELECT * FROM promotions 
        WHERE is_active = 1
        AND (store_id = ? OR store_id IS NULL)
      `;
      params = [storeId];
    }

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);

  } catch (err) {
    return NextResponse.json({ error: "Error fetching promotions" }, { status: 500 });
  }
}



/**
 * POST — สร้างโปรโมชั่นของร้าน
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      store_id,          // อาจเป็น NULL
      title,
      description,
      token_cost,
      image_url,
      is_active,
      discount_type,
      discount_value,
      max_discount,
      applies_to,
      item_id,
      min_order_amount
    } = body;

    await db.query(
      `
      INSERT INTO promotions (
        store_id,
        title,
        description,
        token_cost,
        image_url,
        is_active,
        discount_type,
        discount_value,
        max_discount,
        applies_to,
        item_id,
        min_order_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        store_id || null,
        title,
        description,
        token_cost,
        image_url,
        is_active ?? 1,
        discount_type,
        discount_value,
        max_discount,
        applies_to,
        item_id || null,
        min_order_amount
      ]
    );

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("POST /api/promotions error:", error);
    return NextResponse.json(
      { error: "Failed to create promotion", detail: String(error) },
      { status: 500 }
    );
  }
}
