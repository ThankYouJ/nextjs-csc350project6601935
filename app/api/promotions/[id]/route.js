// app/api/promotions/[id]/route.js
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

/** GET */
export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const [rows] = await db.query(
      "SELECT * FROM promotions WHERE promotion_id = ?",
      [id]
    );

    if (rows.length === 0)
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });

    return NextResponse.json(rows[0], { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: "Error fetching promotion" }, { status: 500 });
  }
}

/** PUT (แก้โปรโดยไม่เปลี่ยน store_id) */
export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const {
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
    UPDATE promotions SET
        title = ?,
        description = ?,
        token_cost = ?,
        image_url = ?,
        is_active = COALESCE(?, is_active),
        discount_type = ?,
        discount_value = ?,
        max_discount = ?,
        applies_to = ?,
        item_id = ?,
        min_order_amount = ?
    WHERE promotion_id = ?
    `,
    [
        title,
        description,
        token_cost,
        image_url,
        is_active,               // ❗ undefined → จะไม่ทับค่าเก่าเพราะ COALESCE
        discount_type,
        discount_value,
        max_discount,
        applies_to,
        item_id || null,
        min_order_amount,
        id,
    ]
    );


    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error updating promotion" }, { status: 500 });
  }
}

/** DELETE */
export async function DELETE(req, context) {
  try {
    const { id } = await context.params;

    await db.query("DELETE FROM promotions WHERE promotion_id = ?", [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Error deleting promotion" }, { status: 500 });
  }
}
