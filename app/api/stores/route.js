import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
ตาราง stores:
  store_id, store_name, store_phone, location, store_image, merchant_id
*/

//
// ========== GET (รองรับ store_id + merchant_id) =========
//
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const store_id = searchParams.get("store_id");
    const merchant_id = searchParams.get("merchant_id");

    let sql = "SELECT * FROM stores";
    const params = [];

    if (merchant_id) {
      sql += " WHERE merchant_id = ?";
      params.push(merchant_id);
    }

    if (store_id) {
      sql += params.length ? " AND store_id = ?" : " WHERE store_id = ?";
      params.push(store_id);
    }

    const [rows] = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stores: " + error },
      { status: 500 }
    );
  }
}


//
// ========== POST (สร้างร้านใหม่, ผูก merchant_id) =========
//
export async function POST(request) {
  try {
    const body = await request.json();
    /*
      body = {
        store_name,
        store_phone,
        location,
        store_image,
        merchant_id
      }
    */
    const { store_name, store_phone, location, store_image, merchant_id } = body;

    const [result] = await db.query(
      `INSERT INTO stores (store_name, store_phone, location, store_image, merchant_id)
       VALUES (?,?,?,?,?)`,
      [store_name, store_phone, location, store_image, merchant_id ?? null]
    );

    return NextResponse.json(
      { message: "Store created", insertId: result.insertId },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create store: " + error },
      { status: 500 }
    );
  }
}


//
// ========== PUT (แก้ไขร้าน — เฉพาะแอดมิน หรือ merchant เจ้าของร้าน) ========
//
export async function PUT(request) {
  try {
    const body = await request.json();
    /*
      body = {
        store_id,
        store_name,
        store_phone,
        location,
        store_image,
        merchant_id   <-- ใส่มาด้วยถ้าจะอัปเดตว่าใครเป็นเจ้าของ
      }
    */

    const { store_id, store_name, store_phone, location, store_image, merchant_id } = body;

    if (!store_id) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    await db.query(
      `UPDATE stores
       SET store_name=?, store_phone=?, location=?, store_image=?, merchant_id=?
       WHERE store_id=?`,
      [
        store_name,
        store_phone,
        location,
        store_image,
        merchant_id ?? null,
        store_id
      ]
    );

    return NextResponse.json({ message: "Store updated" }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update store: " + error },
      { status: 500 }
    );
  }
}


//
// ========== DELETE (แค่ลบร้านตาม store_id) =========
//
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store_id = searchParams.get("store_id");

    if (!store_id) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    await db.query(`DELETE FROM stores WHERE store_id=?`, [store_id]);

    return NextResponse.json({ message: "Store deleted" }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete store: " + error },
      { status: 500 }
    );
  }
}
