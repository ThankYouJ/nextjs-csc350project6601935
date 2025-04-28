import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
order_items:
  order_item_id, quantity, order_id, item_id, item_price

อยาก Join menu_items เพื่อดึง item_name => SELECT ... FROM order_items JOIN menu_items
*/

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    let sql = `
      SELECT 
        oi.order_item_id,
        oi.quantity,
        oi.order_id,
        oi.item_id,
        oi.item_price,
        mi.item_name
      FROM order_items oi
      JOIN menu_items mi ON oi.item_id = mi.item_id
    `;
    const params = [];

    if (order_id) {
      sql += ' WHERE oi.order_id=?';
      params.push(order_id);
    }

    const [rows] = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order_items: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // { order_id, item_id, quantity, item_price }
    const body = await request.json();
    const { order_id, item_id, quantity, item_price } = body;

    const [result] = await db.query(
      `INSERT INTO order_items
       (order_id, item_id, quantity, item_price)
       VALUES (?,?,?,?)`,
      [order_id, item_id, quantity, item_price]
    );

    return NextResponse.json({ message: 'Order item created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order item: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // { order_item_id, quantity, item_price }
    const body = await request.json();
    const { order_item_id, quantity, item_price } = body;

    if (!order_item_id) {
      return NextResponse.json({ error: 'order_item_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE order_items
       SET quantity=?, item_price=?
       WHERE order_item_id=?`,
      [quantity, item_price, order_item_id]
    );

    return NextResponse.json({ message: 'Order item updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order item: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const order_item_id = searchParams.get('order_item_id');

    if (!order_item_id) {
      return NextResponse.json({ error: 'order_item_id is required' }, { status: 400 });
    }

    await db.query('DELETE FROM order_items WHERE order_item_id=?', [order_item_id]);
    return NextResponse.json({ message: 'Order item deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order item: ' + error }, { status: 500 });
  }
}
