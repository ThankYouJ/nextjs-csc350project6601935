// app/api/promotions/route.js
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM promotions WHERE is_active = 1"
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}
