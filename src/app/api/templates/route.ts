import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const query = category
    ? db.select().from(templates).where(eq(templates.category, category))
    : db.select().from(templates);

  const items = await query;

  return NextResponse.json({ items });
}
