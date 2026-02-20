import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const byProvider = await db
    .select({
      provider: generations.provider,
      total: sql<number>`COALESCE(SUM(${generations.costUsd}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(generations)
    .where(sql`${generations.status} = 'completed'`)
    .groupBy(generations.provider);

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
    byProvider,
    byQuality,
    limits: {
      dailyAlertUsd: parseFloat(process.env.DAILY_COST_ALERT_USD ?? "50"),
      monthlyCostCapUsd: parseFloat(process.env.MONTHLY_COST_CAP_USD ?? "500"),
    },
  });
}
