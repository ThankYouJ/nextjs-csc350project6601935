import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

/*
ตาราง users ตามต้องการ
*/

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users: ' + error }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fname,
      lname,
      username,
      email,
      password,
      phone,
      address,
      user_type = 'regular',
      role = 'user'
    } = body;

    const [result] = await db.query(
      `INSERT INTO users (fname, lname, username, email, password, user_phone, user_address, user_type, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fname, lname, username, email, password, phone, address, user_type, role]
    );

    return NextResponse.json({ message: 'User created', insertId: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user: ' + error }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    // รับ { user_id, ... }
    const {
      user_id,
      fname,
      email,
      lname,
      phone,
      address,
      user_type,
      role
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    await db.query(
      `UPDATE users
       SET fname=?, lname=?, email=?, user_phone=?, user_address=?, user_type=?, role=?
       WHERE user_id=?`,
      [fname, lname, email, phone, address, user_type, role, user_id]
    );

    return NextResponse.json({ message: 'User updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user: ' + error }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    await db.query('DELETE FROM users WHERE user_id=?', [user_id]);
    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user: ' + error }, { status: 500 });
  }
}
