import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store_id = searchParams.get('store_id');
    const user_id = searchParams.get('user_id'); // ✅ รับค่า user_id เพิ่ม

    let sql = 'SELECT * FROM stores';
    const params = [];

    // กรณี 1: ค้นหาด้วย store_id (เช่น หน้าเมนูอาหาร)
    if (store_id) {
      sql += ' WHERE store_id = ?';
      params.push(store_id);
    } 
    // กรณี 2: ค้นหาด้วย user_id (เช่น หน้า Merchant เจ้าของร้าน)
    else if (user_id) {
      sql += ' WHERE user_id = ?';
      params.push(user_id);
    }

    const [rows] = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stores: ' + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    // ✅ เพิ่ม user_id ตอนสร้างร้านด้วย
    const { store_name, store_phone, location, store_image, user_id } = body;

    const [result] = await db.query(
      `INSERT INTO stores (store_name, store_phone, location, store_image, user_id)
       VALUES (?,?,?,?,?)`,
      [store_name, store_phone, location, store_image, user_id]
    );

    return NextResponse.json({ message: 'Store created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create store: ' + error.message }, { status: 500 });
  }
}
// PUT, DELETE ใช้โค้ดเดิมได้เลย (ถ้ามี)