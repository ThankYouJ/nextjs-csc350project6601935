import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

// GET: ดึง orders เฉพาะร้านของ merchant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const store_id = searchParams.get("store_id");
    if (!store_id) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 }
      );
    }

    const [orders] = await db.query(
      `SELECT * FROM orders WHERE store_id = ? ORDER BY order_id DESC`,
      [store_id]
    );

    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch merchant orders: " + err },
      { status: 500 }
    );
  }
}

// PUT: เปลี่ยนสถานะ order
export async function PUT(request) {
  try {
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: "order_id & status required" },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE orders SET status = ? WHERE order_id = ?`,
      [status, order_id]
    );

    return NextResponse.json({ message: "Order updated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update order: " + err },
      { status: 500 }
    );
  }
}
