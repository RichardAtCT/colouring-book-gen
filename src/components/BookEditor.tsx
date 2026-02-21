"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
}

interface BookPage {
  generationId: string;
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  prompt: string;
}

interface BookEditorProps {
  bookId?: string;
}

export function BookEditor({ bookId }: BookEditorProps) {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<BookPage[]>([]);
  const [availableGenerations, setAvailableGenerations] = useState<
    Generation[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [footerText, setFooterText] = useState("Coloured by: ___________");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBookId, setSavedBookId] = useState(bookId);

  const fetchGenerations = useCallback(async () => {
    const response = await fetch("/api/gallery?limit=50");
    if (response.ok) {
      const data = await response.json();
      setAvailableGenerations(data.items);
    }
  }, []);

  const fetchBook = useCallback(async () => {
    if (!bookId) return;
    const response = await fetch(`/api/book/${bookId}`);
    if (response.ok) {
      const data = await response.json();
      setTitle(data.title);
      setPages(
        data.pages.map(
          (p: {
            generationId: string;
            pageNumber: number;
            imageUrl: string;
            thumbnailUrl: string | null;
            prompt: string;
          }) => ({
            generationId: p.generationId,
            pageNumber: p.pageNumber,
            imageUrl: p.imageUrl,
            thumbnailUrl: p.thumbnailUrl,
            prompt: p.prompt,
          })
        )
      );
    }
  }, [bookId]);

  useEffect(() => {
    fetchGenerations();
    fetchBook();
  }, [fetchGenerations, fetchBook]);

  const toggleSelection = (gen: Generation) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(gen.id)) {
      newSelected.delete(gen.id);
    } else {
      newSelected.add(gen.id);
    }
    setSelectedIds(newSelected);
  };

  const addSelectedPages = () => {
    const newPages: BookPage[] = [];
    let nextPageNum = pages.length + 1;

    for (const gen of availableGenerations) {
      if (selectedIds.has(gen.id) && !pages.some((p) => p.generationId === gen.id)) {
        newPages.push({
          generationId: gen.id,
          pageNumber: nextPageNum++,
          imageUrl: gen.imageUrl,
          thumbnailUrl: gen.thumbnailUrl,
          prompt: gen.prompt,
        });
      }
    }

    setPages([...pages, ...newPages]);
    setSelectedIds(new Set());
  };

  const removePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages.map((p, i) => ({ ...p, pageNumber: i + 1 })));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(pages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setPages(reordered.map((p, i) => ({ ...p, pageNumber: i + 1 })));
  };

  const saveBook = async () => {
    if (!title.trim() || pages.length === 0) return;

    setIsSaving(true);
    try {
      if (savedBookId) {
        await fetch(`/api/book/${savedBookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            pages: pages.map((p) => ({
              generationId: p.generationId,
              pageNumber: p.pageNumber,
            })),
          }),
        });
      } else {
        const response = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            pages: pages.map((p) => ({
              generationId: p.generationId,
              pageNumber: p.pageNumber,
            })),
          }),
        });
        const data = await response.json();
        setSavedBookId(data.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const compilePdf = async () => {
    const id = savedBookId;
    if (!id) {
      await saveBook();
    }
    const compileId = savedBookId ?? id;
    if (!compileId) return;

    setIsCompiling(true);
    try {
      const response = await fetch(`/api/book/${compileId}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSize,
          includePageNumbers,
          includeFooter,
          footerText,
        }),
      });

      if (response.headers.get("Content-Type")?.includes("application/pdf")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || "colouring-book"}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (response.ok) {
        const data = await response.json();
        if (data.pdfUrl) {
          window.open(data.pdfUrl, "_blank");
        }
      }
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Book title */}
      <div className="space-y-2">
        <label htmlFor="book-title" className="text-sm font-medium">
          Book Title
        </label>
        <input
          id="book-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Colouring Book"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Page selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Select Pages</h3>
        {availableGenerations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No generated pages yet. Create some colouring pages first!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {availableGenerations.map((gen) => {
                const alreadyAdded = pages.some(
                  (p) => p.generationId === gen.id
                );
                return (
                  <button
                    key={gen.id}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => toggleSelection(gen)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedIds.has(gen.id)
                        ? "border-primary"
                        : alreadyAdded
                          ? "border-muted opacity-40"
                          : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gen.thumbnailUrl ?? gen.imageUrl}
                      alt={gen.prompt}
                      className="h-full w-full object-cover"
                    />
                    {selectedIds.has(gen.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/30 backdrop-blur-[1px]">
                        <span className="text-lg">&#x2713;</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedIds.size > 0 && (
              <Button size="sm" onClick={addSelectedPages}>
                Add {selectedIds.size} page{selectedIds.size > 1 ? "s" : ""}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Page order (drag and drop) */}
      {pages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Page Order (drag to reorder)
          </h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pages" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-3 overflow-x-auto pb-2"
                >
                  {pages.map((page, index) => (
                    <Draggable
                      key={page.generationId}
                      draggableId={page.generationId}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative flex-shrink-0 transition-transform ${
                            snapshot.isDragging ? "scale-105 rotate-1 shadow-xl" : ""
                          }`}
                        >
                          <Card className="w-24 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={page.thumbnailUrl ?? page.imageUrl}
                              alt={page.prompt}
                              className="aspect-square w-full object-cover"
                            />
                            <div className="p-1 text-center text-xs text-muted-foreground">
                              Page {page.pageNumber}
                            </div>
                          </Card>
                          <button
                            type="button"
                            onClick={() => removePage(index)}
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
                          >
                            &#x2715;
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Compile options */}
      {pages.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-medium">PDF Options</h3>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pageSize"
                checked={pageSize === "A4"}
                onChange={() => setPageSize("A4")}
              />
              A4
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pageSize"
                checked={pageSize === "Letter"}
                onChange={() => setPageSize("Letter")}
              />
              US Letter
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includePageNumbers}
              onChange={(e) => setIncludePageNumbers(e.target.checked)}
            />
            Include page numbers
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeFooter}
              onChange={(e) => setIncludeFooter(e.target.checked)}
            />
            Include footer
          </label>

          {includeFooter && (
            <Textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Footer text..."
              rows={1}
              className="resize-none"
            />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={saveBook} disabled={isSaving || !title.trim()}>
              {isSaving ? "Saving..." : "Save Book"}
            </Button>
            <Button onClick={compilePdf} disabled={isCompiling || !title.trim()}>
              {isCompiling ? "Compiling PDF..." : "Compile & Download PDF"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
