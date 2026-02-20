import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { getDefaultUserId } from "@/lib/default-user";

export async function GET(request: NextRequest) {
  const userId = await getDefaultUserId();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const favouritesOnly = searchParams.get("favourites") === "true";

  const where = favouritesOnly
    ? and(
        eq(generations.userId, userId),
        eq(generations.status, "completed"),
        eq(generations.isFavourite, true)
      )
    : and(
        eq(generations.userId, userId),
        eq(generations.status, "completed")
      );

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(generations)
      .where(where)
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(generations).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getDefaultUserId();

  const body = await request.json();
  const { id, isFavourite } = body;

  if (!id || typeof isFavourite !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db
    .update(generations)
    .set({ isFavourite })
    .where(
      and(eq(generations.id, id), eq(generations.userId, userId))
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getDefaultUserId();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db
    .update(generations)
    .set({ status: "failed" })
    .where(
      and(eq(generations.id, id), eq(generations.userId, userId))
    );

  return NextResponse.json({ success: true });
}
