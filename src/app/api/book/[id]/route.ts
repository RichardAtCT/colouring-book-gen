import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { books, bookPages, generations } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const bookResult = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, session.user.id)))
    .limit(1);

  const book = bookResult[0];
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pages = await db
    .select({
      id: bookPages.id,
      pageNumber: bookPages.pageNumber,
      includePageNumber: bookPages.includePageNumber,
      includeFooter: bookPages.includeFooter,
      generationId: bookPages.generationId,
      imageUrl: generations.imageUrl,
      thumbnailUrl: generations.thumbnailUrl,
      prompt: generations.prompt,
    })
    .from(bookPages)
    .innerJoin(generations, eq(bookPages.generationId, generations.id))
    .where(eq(bookPages.bookId, id))
    .orderBy(asc(bookPages.pageNumber));

  return NextResponse.json({ ...book, pages });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const bookResult = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, session.user.id)))
    .limit(1);

  if (!bookResult[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update title if provided
  if (body.title) {
    await db
      .update(books)
      .set({ title: body.title, updatedAt: new Date() })
      .where(eq(books.id, id));
  }

  // Update pages if provided
  if (Array.isArray(body.pages)) {
    // Delete existing pages and re-insert
    await db.delete(bookPages).where(eq(bookPages.bookId, id));

    for (const page of body.pages) {
      await db.insert(bookPages).values({
        id: crypto.randomUUID(),
        bookId: id,
        generationId: page.generationId,
        pageNumber: page.pageNumber,
        includePageNumber: page.includePageNumber ?? true,
        includeFooter: page.includeFooter ?? true,
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(books)
    .where(and(eq(books.id, id), eq(books.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
