import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { books, bookPages, generations } from "@/lib/db/schema";
import { compileBook, type BookCompileOptions } from "@/lib/pdf";
import { uploadImage, readImageFromUrl } from "@/lib/storage";
import { getDefaultUserId } from "@/lib/default-user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId();
  const { id } = await params;

  // Get book and verify ownership
  const bookResult = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
    .limit(1);

  const book = bookResult[0];
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get pages with image URLs
  const pages = await db
    .select({
      pageNumber: bookPages.pageNumber,
      imageUrl: generations.imageUrl,
    })
    .from(bookPages)
    .innerJoin(generations, eq(bookPages.generationId, generations.id))
    .where(eq(bookPages.bookId, id))
    .orderBy(asc(bookPages.pageNumber));

  if (pages.length === 0) {
    return NextResponse.json(
      { error: "Book has no pages" },
      { status: 400 }
    );
  }

  try {
    // Fetch all images
    const pageData = await Promise.all(
      pages.map(async (page) => ({
        imageBytes: await readImageFromUrl(page.imageUrl!),
        pageNumber: page.pageNumber,
      }))
    );

    // Parse compile options from request body
    const body = await request.json().catch(() => ({}));

    // Fetch cover image if coverGenerationId provided
    let coverImageBytes: Buffer | undefined;
    if (body.coverGenerationId) {
      const coverResult = await db
        .select({ imageUrl: generations.imageUrl })
        .from(generations)
        .where(eq(generations.id, body.coverGenerationId))
        .limit(1);

      const coverGen = coverResult[0];
      if (coverGen?.imageUrl) {
        coverImageBytes = await readImageFromUrl(coverGen.imageUrl);
      }
    }

    const options: BookCompileOptions = {
      pageSize: body.pageSize ?? "A4",
      includePageNumbers: body.includePageNumbers ?? true,
      includeFooter: body.includeFooter ?? true,
      footerText: body.footerText ?? "Coloured by: ___________",
      coverImageBytes,
    };

    // Compile PDF
    const pdfBuffer = await compileBook(book.title, pageData, options);

    // Upload PDF to storage
    let pdfUrl: string;
    try {
      const pdfKey = `books/${id}/${book.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      pdfUrl = await uploadImage(pdfBuffer, pdfKey, "application/pdf");
    } catch {
      // If storage upload fails, return the PDF directly
      await db
        .update(books)
        .set({ status: "compiled", updatedAt: new Date() })
        .where(eq(books.id, id));

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${book.title}.pdf"`,
        },
      });
    }

    // Update book record
    await db
      .update(books)
      .set({ pdfUrl, status: "compiled", updatedAt: new Date() })
      .where(eq(books.id, id));

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("PDF compilation failed:", error);

    await db
      .update(books)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(books.id, id));

    return NextResponse.json(
      { error: "PDF compilation failed" },
      { status: 500 }
    );
  }
}
