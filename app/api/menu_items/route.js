import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
menu_items:
  item_id, item_name, item_price, available, description, item_image, store_id
*/

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store_id = searchParams.get('store_id');

    let sql = `
      SELECT
        item_id,
        item_name,
        item_price,
        available,
        description,
        item_image,
        store_id
      FROM menu_items
    `;
    const params = [];

    if (store_id) {
      sql += ' WHERE store_id=?';
      params.push(store_id);
    }

    const [rows] = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu_items: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // { item_name, item_price, available, description, item_image, store_id }
    const body = await request.json();
    const { item_name, item_price, available, description, item_image, store_id } = body;

    const [result] = await db.query(
      `INSERT INTO menu_items
       (item_name, item_price, available, description, item_image, store_id)
       VALUES (?,?,?,?,?,?)`,
      [item_name, item_price, available, description, item_image, store_id]
    );

    return NextResponse.json({ message: 'Menu item created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // { item_id, item_name, item_price, available, description, item_image, store_id }
    const body = await request.json();
    const {
      item_id,
      item_name,
      item_price,
      available,
      description,
      item_image,
      store_id
    } = body;

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE menu_items
       SET item_name=?, item_price=?, available=?, description=?, item_image=?, store_id=?
       WHERE item_id=?`,
      [item_name, item_price, available, description, item_image, store_id, item_id]
    );

    return NextResponse.json({ message: 'Menu item updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu item: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get('item_id');

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    await db.query('DELETE FROM menu_items WHERE item_id=?', [item_id]);
    return NextResponse.json({ message: 'Menu item deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete menu item: ' + error }, { status: 500 });
  }
}
