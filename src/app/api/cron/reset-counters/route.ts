import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset daily counters
  await db
    .update(users)
    .set({ generationsToday: 0 });

  // Reset monthly counters on the 1st of each month
  const today = new Date();
  if (today.getDate() === 1) {
    await db
      .update(users)
      .set({ generationsThisMonth: 0 });
  }

  return NextResponse.json({
    success: true,
    resetDaily: true,
    resetMonthly: today.getDate() === 1,
    timestamp: today.toISOString(),
  });
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}

// Vercel Cron config
export const dynamic = "force-dynamic";
export const maxDuration = 10;
