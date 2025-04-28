import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
ตาราง stores:
  store_id, store_name, store_phone, location, store_image
*/

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM stores');
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stores: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    // { store_name, store_phone, location, store_image }
    const { store_name, store_phone, location, store_image } = body;

    const [result] = await db.query(
      `INSERT INTO stores (store_name, store_phone, location, store_image)
       VALUES (?,?,?,?)`,
      [store_name, store_phone, location, store_image]
    );

    return NextResponse.json({ message: 'Store created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create store: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    // { store_id, store_name, store_phone, location, store_image }
    const { store_id, store_name, store_phone, location, store_image } = body;

    if (!store_id) {
      return NextResponse.json({ error: 'store_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE stores
       SET store_name=?, store_phone=?, location=?, store_image=?
       WHERE store_id=?`,
      [store_name, store_phone, location, store_image, store_id]
    );

    return NextResponse.json({ message: 'Store updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update store: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store_id = searchParams.get('store_id');

    if (!store_id) {
      return NextResponse.json({ error: 'store_id is required' }, { status: 400 });
    }

    await db.query('DELETE FROM stores WHERE store_id=?', [store_id]);
    return NextResponse.json({ message: 'Store deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete store: ' + error }, { status: 500 });
  }
}
