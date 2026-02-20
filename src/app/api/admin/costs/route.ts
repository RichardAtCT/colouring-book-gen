import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dailyCost] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${generations.costUsd}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(generations)
    .where(
      sql`${generations.createdAt} >= ${Math.floor(today.getTime() / 1000)} AND ${generations.status} = 'completed'`
    );

  const [monthlyCost] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${generations.costUsd}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(generations)
    .where(
      sql`${generations.createdAt} >= ${Math.floor(firstOfMonth.getTime() / 1000)} AND ${generations.status} = 'completed'`
    );

  const byQuality = await db
    .select({
      quality: generations.quality,
      total: sql<number>`COALESCE(SUM(${generations.costUsd}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(generations)
    .where(sql`${generations.status} = 'completed'`)
    .groupBy(generations.quality);

  return NextResponse.json({
    daily: dailyCost,
    monthly: monthlyCost,
    byQuality,
  });
}
