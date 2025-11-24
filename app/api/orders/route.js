import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

function generateBillCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

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
    console.error("GET Order Error:", error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      store_id, // ✅ รับ store_id
      delivery_fee = 0,
      discount = 0,
      total_price = 0,
      status = 'Pending',
      order_items = []
    } = body;

    let billCode = '';
    let isUnique = false;
    let maxRetries = 10; 

    while (!isUnique && maxRetries > 0) {
      billCode = generateBillCode();
      try {
        const [existing] = await db.query('SELECT order_id FROM orders WHERE bill_code = ?', [billCode]);
        if (existing.length === 0) {
          isUnique = true;
        }
      } catch (err) {
        console.error("Check BillCode Error:", err.message);
        throw new Error("Database error: Please check if 'bill_code' column exists and is VARCHAR type.");
      }
      maxRetries--;
    }

    if (!isUnique) {
      throw new Error("Failed to generate unique bill code");
    }

    // ✅ เพิ่ม store_id ลงในคำสั่ง INSERT
    const [resOrder] = await db.query(
      `INSERT INTO orders
       (user_id, store_id, delivery_fee, discount, total_price, status, order_time, bill_code)
       VALUES (?,?,?,?,?,?,NOW(),?)`,
      [user_id, store_id, delivery_fee, discount, total_price, status, billCode]
    );
    
    const newOrderId = resOrder.insertId;

    if (order_items.length > 0) {
        const itemValues = order_items.map(it => [newOrderId, it.item_id, it.quantity, it.item_price]);
        await db.query(
            `INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES ?`,
            [itemValues]
        );
    }

    return NextResponse.json({ 
        message: 'Order created', 
        order_id: newOrderId, 
        bill_code: billCode 
    }, { status: 201 });

  } catch (error) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: 'Failed to create order: ' + error.message }, { status: 500 });
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

    await db.query('DELETE FROM order_items WHERE order_id=?', [order_id]);
    await db.query('DELETE FROM orders WHERE order_id=?', [order_id]);

    return NextResponse.json({ message: 'Order deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order: ' + error }, { status: 500 });
  }
}