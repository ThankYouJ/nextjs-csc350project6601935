import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `SELECT 
          up.id,
          up.status,
          up.promotion_id,
          p.title,
          p.description,
          p.image_url,
          p.discount_type,       
          p.discount_value,      
          p.applies_to,          
          p.item_id,             
          p.max_discount,        
          p.min_order_amount     
       FROM user_promotions up
       JOIN promotions p ON up.promotion_id = p.promotion_id
       WHERE up.user_id = ? AND up.status = 'unused'`,
      [user_id]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/users/promotions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user promotions" },
      { status: 500 }
    );
  }
}
