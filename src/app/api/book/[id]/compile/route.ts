import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { books, bookPages, generations } from "@/lib/db/schema";
import { compileBook, type BookCompileOptions } from "@/lib/pdf";
import { uploadImage } from "@/lib/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get book and verify ownership
  const bookResult = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, session.user.id)))
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
      pages.map(async (page) => {
        let imageBytes: Buffer;

        if (page.imageUrl?.startsWith("data:")) {
          // Base64 data URL
          const base64 = page.imageUrl.split(",")[1];
          imageBytes = Buffer.from(base64!, "base64");
        } else {
          // Fetch from URL (R2)
          const response = await fetch(page.imageUrl!);
          imageBytes = Buffer.from(await response.arrayBuffer());
        }

        return {
          imageBytes,
          pageNumber: page.pageNumber,
        };
      })
    );

    // Parse compile options from request body
    const body = await request.json().catch(() => ({}));
    const options: BookCompileOptions = {
      pageSize: body.pageSize ?? "A4",
      includePageNumbers: body.includePageNumbers ?? true,
      includeFooter: body.includeFooter ?? true,
      footerText: body.footerText ?? "Coloured by: ___________",
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
