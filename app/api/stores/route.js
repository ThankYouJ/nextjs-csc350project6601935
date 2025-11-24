import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
ตาราง stores:
  store_id, store_name, store_phone, location, store_image, user_id
*/

//
// ========== GET (รองรับ store_id + user_id) =========
//
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const store_id = searchParams.get("store_id");
    const user_id = searchParams.get("user_id");

    let sql = "SELECT * FROM stores";
    const params = [];

    if (user_id) {
      sql += " WHERE user_id = ?";
      params.push(user_id);
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
// ========== POST (สร้างร้านใหม่, ผูก user_id) =========
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
        user_id
      }
    */
    const { store_name, store_phone, location, store_image, user_id } = body;

    const [result] = await db.query(
      `INSERT INTO stores (store_name, store_phone, location, store_image, user_id)
       VALUES (?,?,?,?,?)`,
      [store_name, store_phone, location, store_image, user_id ?? null]
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
        user_id  
      }
    */

    const { store_id, store_name, store_phone, location, store_image, user_id } = body;

    if (!store_id) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    await db.query(
      `UPDATE stores
       SET store_name=?, store_phone=?, location=?, store_image=?, user_id=?
       WHERE store_id=?`,
      [
        store_name,
        store_phone,
        location,
        store_image,
        user_id ?? null,
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
