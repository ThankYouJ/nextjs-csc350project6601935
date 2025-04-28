import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
orders:
  order_id, order_time, status, delivery_fee, discount, total_price, user_id
*/

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    let sql = 'SELECT * FROM orders';
    const params = [];
    if (user_id) {
      sql += ' WHERE user_id=?';
      params.push(user_id);
    }

    const [rows] = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // { user_id, delivery_fee, discount, total_price, status, order_items: [...]}
    const body = await request.json();
    const {
      user_id,
      delivery_fee = 0,
      discount = 0,
      total_price = 0,
      status = 'Pending',
      order_items = []
    } = body;

    const [resOrder] = await db.query(
      `INSERT INTO orders
       (user_id, delivery_fee, discount, total_price, status, order_time)
       VALUES (?,?,?,?,?,NOW())`,
      [user_id, delivery_fee, discount, total_price, status]
    );
    const newOrderId = resOrder.insertId;

    // Insert order_items
    for (const it of order_items) {
      await db.query(
        `INSERT INTO order_items
         (order_id, item_id, quantity, item_price)
         VALUES (?,?,?,?)`,
        [newOrderId, it.item_id, it.quantity, it.item_price]
      );
    }

    return NextResponse.json({ message: 'Order created', order_id: newOrderId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { order_id, status } = body;
    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE orders SET status=? WHERE order_id=?`,
      [status, order_id]
    );
    return NextResponse.json({ message: 'Order updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    // ลบ order_items ก่อน
    await db.query('DELETE FROM order_items WHERE order_id=?', [order_id]);
    await db.query('DELETE FROM orders WHERE order_id=?', [order_id]);

    return NextResponse.json({ message: 'Order deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order: ' + error }, { status: 500 });
  }
}
