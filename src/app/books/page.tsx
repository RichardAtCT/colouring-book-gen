"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Book {
  id: string;
  title: string;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/book")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setBooks(data.items))
      .finally(() => setIsLoading(false));
  }, []);

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/book/${id}`, { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">My Books</h2>
          <p className="text-muted-foreground">
            Your compiled colouring books.
          </p>
        </div>
        <Button asChild>
          <Link href="/book/new">New Book</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : books.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No books yet. Create your first colouring book!
          </p>
          <Button asChild className="mt-4">
            <Link href="/book/new">Create a Book</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <Card key={book.id} className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">{book.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {book.status === "compiled" ? "Compiled" : "Draft"} &middot;{" "}
                  {new Date(book.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {book.pdfUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={book.pdfUrl} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/book/${book.id}`}>Edit</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteBook(book.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
