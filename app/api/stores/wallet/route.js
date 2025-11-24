import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// PUT = Save wallet address
export async function PUT(req) {
  try {
    const { store_id, merchantAddress } = await req.json();

    if (!store_id || !merchantAddress) {
      return NextResponse.json(
        { error: "store_id และ merchantAddress จำเป็นต้องมี" },
        { status: 400 }
      );
    }

    const db = mysqlPool.promise();

    await db.query(
      `UPDATE stores SET MERCHANT_ADDRESS = ? WHERE store_id = ?`,
      [merchantAddress, store_id]
    );

    const [storeRows] = await db.query(
      `SELECT * FROM stores WHERE store_id = ?`,
      [store_id]
    );

    return NextResponse.json(
      {
        success: true,
        store: storeRows[0],
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("🔥 ERROR /api/stores/wallet (PUT):", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// DELETE = Remove wallet address
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const store_id = searchParams.get("store_id");

    if (!store_id) {
      return NextResponse.json(
        { error: "ต้องส่ง store_id" },
        { status: 400 }
      );
    }

    const db = mysqlPool.promise();

    await db.query(
      `UPDATE stores SET MERCHANT_ADDRESS = '' WHERE store_id = ?`,
      [store_id]
    );

    const [storeRows] = await db.query(
      `SELECT * FROM stores WHERE store_id = ?`,
      [store_id]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Wallet address removed",
        store: storeRows[0],
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("🔥 ERROR /api/stores/wallet (DELETE):", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

