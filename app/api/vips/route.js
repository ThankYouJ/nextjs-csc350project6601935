import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
ตาราง vips:
  vip_id, user_id, vip_code, discount_rate
*/

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM vips');
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vips: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // รับ { user_id, vip_code, discount_rate }
    const body = await request.json();
    const { user_id, vip_code, discount_rate = 20 } = body;

    if (!user_id || !vip_code) {
      return NextResponse.json({ error: 'user_id and vip_code are required' }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO vips (user_id, vip_code, discount_rate)
       VALUES (?,?,?)`,
      [user_id, vip_code, discount_rate]
    );

    return NextResponse.json({ message: 'VIP created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vip: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // รับ { vip_id, user_id, vip_code, discount_rate }
    const body = await request.json();
    const { vip_id, user_id, vip_code, discount_rate } = body;

    if (!vip_id) {
      return NextResponse.json({ error: 'vip_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE vips
       SET user_id=?, vip_code=?, discount_rate=?
       WHERE vip_id=?`,
      [user_id, vip_code, discount_rate, vip_id]
    );

    return NextResponse.json({ message: 'VIP updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vip: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vip_id = searchParams.get('vip_id');

    if (!vip_id) {
      return NextResponse.json({ error: 'vip_id is required' }, { status: 400 });
    }

    await db.query('DELETE FROM vips WHERE vip_id=?', [vip_id]);
    return NextResponse.json({ message: 'VIP deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vip: ' + error }, { status: 500 });
  }
}
