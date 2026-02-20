import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { books, bookPages } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userBooks = await db
    .select()
    .from(books)
    .where(eq(books.userId, session.user.id))
    .orderBy(desc(books.updatedAt));

  return NextResponse.json({ items: userBooks });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, pages } = body;

  if (!title || !Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json(
      { error: "Title and at least one page are required" },
      { status: 400 }
    );
  }

  const bookId = crypto.randomUUID();

  await db.insert(books).values({
    id: bookId,
    userId: session.user.id,
    title,
    status: "draft",
  });

  for (const page of pages) {
    await db.insert(bookPages).values({
      id: crypto.randomUUID(),
      bookId,
      generationId: page.generationId,
      pageNumber: page.pageNumber,
      includePageNumber: page.includePageNumber ?? true,
      includeFooter: page.includeFooter ?? true,
    });
  }

  return NextResponse.json({ id: bookId }, { status: 201 });
}
