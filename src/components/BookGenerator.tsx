"use client";

import { useState, useRef, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgeRangeSelector } from "@/components/AgeRangeSelector";
import { QualitySelector } from "@/components/QualitySelector";
import type {
  AgeRange,
  QualityTier,
  BookPagePrompt,
  BookPageGenerationState,
  BookCoverState,
  PageGenerationStatus,
} from "@/types";
import { runWithConcurrency, PAGE_GENERATION_CONCURRENCY } from "@/lib/concurrency";
import { formatCost } from "@/lib/costs";

type Step = "concept" | "prompts" | "generating" | "complete";

export function BookGenerator() {
  const [step, setStep] = useState<Step>("concept");

  // Concept step state
  const [concept, setConcept] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange>("5-7");
  const [quality, setQuality] = useState<QualityTier>("low");
  const [pageCount, setPageCount] = useState(10);
  const [bookTitle, setBookTitle] = useState("");
  const [isExpandingPrompts, setIsExpandingPrompts] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);

  // Prompts step state
  const [coverPrompt, setCoverPrompt] = useState<{ id: string; title: string; prompt: string }>({
    id: "",
    title: "Cover",
    prompt: "",
  });
  const [pagePrompts, setPagePrompts] = useState<BookPagePrompt[]>([]);

  // Generating step state
  const [coverState, setCoverState] = useState<BookCoverState | null>(null);
  const [pageStates, setPageStates] = useState<BookPageGenerationState[]>([]);
  const abortRef = useRef(false);
  const coverStateRef = useRef<BookCoverState | null>(null);
  const pageStatesRef = useRef<BookPageGenerationState[]>([]);

  // Complete step state
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const effectiveTitle = bookTitle.trim() || concept.trim();

  const updateCoverState = useCallback((updater: (prev: BookCoverState | null) => BookCoverState | null) => {
    setCoverState((prev) => {
      const next = updater(prev);
      coverStateRef.current = next;
      return next;
    });
  }, []);

  const updatePageStates = useCallback((updater: (prev: BookPageGenerationState[]) => BookPageGenerationState[]) => {
    setPageStates((prev) => {
      const next = updater(prev);
      pageStatesRef.current = next;
      return next;
    });
  }, []);

  // Step 1: Expand concept into prompts
  const handleExpandPrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExpandingPrompts(true);
    setExpandError(null);

    try {
      const response = await fetch("/api/book/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept.trim(),
          ageRange,
          pageCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setExpandError(data.error ?? "Failed to generate prompts");
        return;
      }

      const data = await response.json();
      setCoverPrompt(data.cover);
      setPagePrompts(data.pages);
      setStep("prompts");
    } catch {
      setExpandError("Something went wrong. Please try again.");
    } finally {
      setIsExpandingPrompts(false);
    }
  };

  // Prompts step: editing helpers
  const updatePagePrompt = (id: string, field: "title" | "prompt", value: string) => {
    setPagePrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const deletePagePrompt = (id: string) => {
    setPagePrompts((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, pageNumber: i + 1 }))
    );
  };

  const addPagePrompt = () => {
    setPagePrompts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        pageNumber: prev.length + 1,
        title: `Page ${prev.length + 1}`,
        prompt: "",
      },
    ]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(pagePrompts);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setPagePrompts(reordered.map((p, i) => ({ ...p, pageNumber: i + 1 })));
  };

  // Step 3: Generate all images
  const handleGenerateAll = useCallback(async () => {
    abortRef.current = false;
    setStep("generating");

    // Initialize states
    const initialCover: BookCoverState = {
      id: coverPrompt.id,
      title: coverPrompt.title,
      prompt: coverPrompt.prompt,
      status: "pending",
    };
    updateCoverState(() => initialCover);

    const initialPages: BookPageGenerationState[] = pagePrompts.map((p) => ({
      ...p,
      status: "pending" as PageGenerationStatus,
    }));
    updatePageStates(() => initialPages);

    // Generate cover first
    const coverResult = await generateSingleImage(
      coverPrompt.prompt,
      ageRange,
      quality,
      (status, data) => {
        updateCoverState((prev) => (prev ? { ...prev, status, ...data } : prev));
      }
    );

    if (abortRef.current) return;

    // Generate pages concurrently
    const pageTasks = pagePrompts.map((page, i) => () =>
      generateSingleImage(page.prompt, ageRange, quality, (status, data) => {
        updatePageStates((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status, ...data } : p))
        );
      })
    );
    await runWithConcurrency(pageTasks, PAGE_GENERATION_CONCURRENCY, abortRef);

    if (!abortRef.current) {
      // Auto-create book and compile
      await createBookAndCompile(coverResult);
    }
  }, [coverPrompt, pagePrompts, ageRange, quality, updateCoverState, updatePageStates]);

  const generateSingleImage = async (
    prompt: string,
    age: AgeRange,
    qual: QualityTier,
    onUpdate: (status: PageGenerationStatus, data?: Record<string, string | number>) => void
  ): Promise<{ generationId?: string; imageUrl?: string }> => {
    onUpdate("generating");

    const maxRetries = 3;
    const baseDelay = 2000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, ageRange: age, quality: qual }),
        });

        if (response.status === 429 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
          continue;
        }

        if (!response.ok) {
          const data = await response.json();
          onUpdate("failed", { error: data.error ?? "Generation failed" });
          return {};
        }

        const data = await response.json();
        onUpdate("done", { generationId: data.id, imageUrl: data.imageUrl, costUsd: data.costUsd });
        return { generationId: data.id, imageUrl: data.imageUrl };
      } catch {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
          continue;
        }
        onUpdate("failed", { error: "Network error" });
        return {};
      }
    }

    onUpdate("failed", { error: "Max retries exceeded" });
    return {};
  };

  const retryItem = async (type: "cover" | "page", index?: number) => {
    if (type === "cover" && coverState) {
      const result = await generateSingleImage(
        coverState.prompt,
        ageRange,
        quality,
        (status, data) => {
          updateCoverState((prev) => (prev ? { ...prev, status, ...data } : prev));
        }
      );
      return result;
    } else if (type === "page" && index !== undefined) {
      const page = pageStates[index];
      if (!page) return;
      await generateSingleImage(
        page.prompt,
        ageRange,
        quality,
        (status, data) => {
          updatePageStates((prev) =>
            prev.map((p, idx) => (idx === index ? { ...p, status, ...data } : p))
          );
        }
      );
    }
  };

  const createBookAndCompile = async (coverResult: { generationId?: string; imageUrl?: string }) => {
    setIsCompiling(true);
    try {
      // Use refs to get the latest state
      const finalCoverGenId = coverStateRef.current?.generationId ?? coverResult.generationId;

      const pageGenIds: { generationId: string; pageNumber: number }[] = [];
      for (const page of pageStatesRef.current) {
        if (page.generationId) {
          pageGenIds.push({
            generationId: page.generationId,
            pageNumber: page.pageNumber,
          });
        }
      }

      if (pageGenIds.length === 0) {
        setIsCompiling(false);
        return;
      }

      // Create book
      const bookResponse = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: effectiveTitle,
          pages: pageGenIds,
        }),
      });

      if (!bookResponse.ok) {
        setIsCompiling(false);
        return;
      }

      const { id: bookId } = await bookResponse.json();
      setSavedBookId(bookId);

      // Compile PDF
      const compileResponse = await fetch(`/api/book/${bookId}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverGenerationId: finalCoverGenId,
        }),
      });

      if (compileResponse.headers.get("Content-Type")?.includes("application/pdf")) {
        const blob = await compileResponse.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else if (compileResponse.ok) {
        const data = await compileResponse.json();
        if (data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
        }
      }

      setStep("complete");
    } catch (error) {
      console.error("Book creation failed:", error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${effectiveTitle || "colouring-book"}.pdf`;
    link.click();
  };

  // Compute progress
  const totalItems = coverState ? 1 + pageStates.length : 0;
  const doneItems =
    (coverState?.status === "done" ? 1 : 0) +
    pageStates.filter((p) => p.status === "done").length;
  const hasFailures =
    coverState?.status === "failed" ||
    pageStates.some((p) => p.status === "failed");
  const allDone = totalItems > 0 && doneItems === totalItems;

  return (
    <div className="space-y-8">
      {/* Step: Concept */}
      {step === "concept" && (
        <form onSubmit={handleExpandPrompts} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="concept" className="text-sm font-medium">
              Book concept
            </label>
            <Textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value.slice(0, 200))}
              placeholder="Dinosaur adventures in a magical forest..."
              rows={3}
              disabled={isExpandingPrompts}
              className="resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">
              {concept.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Age range</label>
            <AgeRangeSelector
              value={ageRange}
              onChange={setAgeRange}
              disabled={isExpandingPrompts}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quality</label>
            <QualitySelector
              value={quality}
              onChange={setQuality}
              disabled={isExpandingPrompts}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pageCount" className="text-sm font-medium">
              Number of pages: {pageCount}
            </label>
            <input
              id="pageCount"
              type="range"
              min={5}
              max={20}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              disabled={isExpandingPrompts}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="bookTitle" className="text-sm font-medium">
              Book title (optional)
            </label>
            <input
              id="bookTitle"
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={concept.trim() || "My Colouring Book"}
              disabled={isExpandingPrompts}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={concept.trim().length < 3 || isExpandingPrompts}
            className="w-full"
            size="lg"
          >
            {isExpandingPrompts ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Generating page ideas...
              </span>
            ) : (
              "Generate Page Ideas"
            )}
          </Button>

          {expandError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {expandError}
            </div>
          )}
        </form>
      )}

      {/* Step: Review/Edit Prompts */}
      {step === "prompts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Review & Edit Pages
            </h2>
            <span className="text-sm text-muted-foreground">
              {pagePrompts.length} pages + cover
            </span>
          </div>

          {/* Cover prompt */}
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Cover
              </span>
            </div>
            <Textarea
              value={coverPrompt.prompt}
              onChange={(e) =>
                setCoverPrompt((prev) => ({ ...prev, prompt: e.target.value }))
              }
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Page prompts with drag-drop */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="prompts">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {pagePrompts.map((page, index) => (
                    <Draggable key={page.id} draggableId={page.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-lg border p-4 ${
                            snapshot.isDragging ? "border-primary shadow-lg" : ""
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-muted-foreground"
                            >
                              &#x2630;
                            </div>
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                              {page.pageNumber}
                            </span>
                            <input
                              type="text"
                              value={page.title}
                              onChange={(e) =>
                                updatePagePrompt(page.id, "title", e.target.value)
                              }
                              className="flex-1 border-b border-transparent bg-transparent text-sm font-medium focus:border-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => deletePagePrompt(page.id)}
                              className="text-muted-foreground hover:text-destructive"
                              title="Delete page"
                            >
                              &#x2715;
                            </button>
                          </div>
                          <Textarea
                            value={page.prompt}
                            onChange={(e) =>
                              updatePagePrompt(page.id, "prompt", e.target.value)
                            }
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Button variant="outline" onClick={addPagePrompt} className="w-full">
            + Add Page
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("concept")}
            >
              Back
            </Button>
            <Button
              onClick={handleGenerateAll}
              disabled={pagePrompts.length === 0 || !coverPrompt.prompt.trim()}
              className="flex-1"
              size="lg"
            >
              Generate All ({pagePrompts.length + 1} images)
            </Button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isCompiling
                  ? "Compiling PDF..."
                  : allDone
                    ? "Generation complete!"
                    : "Generating images..."}
              </h2>
              <span className="text-sm text-muted-foreground">
                {doneItems}/{totalItems}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (doneItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Cover status */}
          {coverState && (
            <GenerationItem
              label="Cover"
              state={coverState}
              onRetry={() => retryItem("cover")}
            />
          )}

          {/* Page statuses */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pageStates.map((page, index) => (
              <GenerationItem
                key={page.id}
                label={`Page ${page.pageNumber}`}
                state={page}
                onRetry={() => retryItem("page", index)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!allDone && !isCompiling && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {allDone && !isCompiling && !savedBookId && (
              <Button onClick={() => createBookAndCompile({
                generationId: coverState?.generationId,
                imageUrl: coverState?.imageUrl,
              })} className="flex-1">
                Compile PDF
              </Button>
            )}
            {hasFailures && !isCompiling && (
              <p className="text-sm text-muted-foreground">
                Some images failed. Use retry buttons, then compile.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Your book is ready!</h2>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {coverState?.imageUrl && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverState.imageUrl}
                  alt="Cover"
                  className="aspect-square w-full rounded-lg border-2 border-primary object-cover"
                />
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Cover
                </span>
              </div>
            )}
            {pageStates
              .filter((p) => p.imageUrl)
              .map((page) => (
                <div key={page.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.imageUrl}
                    alt={page.title}
                    className="aspect-square w-full rounded-lg border object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {page.pageNumber}
                  </span>
                </div>
              ))}
          </div>

          {(() => {
            const totalCost = (coverState?.costUsd ?? 0) + pageStates.reduce((sum, p) => sum + (p.costUsd ?? 0), 0);
            const imageCount = (coverState?.imageUrl ? 1 : 0) + pageStates.filter((p) => p.imageUrl).length;
            return totalCost > 0 ? (
              <p className="text-xs text-muted-foreground text-center">
                Total cost: {formatCost(totalCost)} ({imageCount} images)
              </p>
            ) : null;
          })()}

          <div className="flex gap-3">
            <Button onClick={downloadPdf} disabled={!pdfUrl} size="lg" className="flex-1">
              Download PDF
            </Button>
            {savedBookId && (
              <Button
                variant="outline"
                onClick={() => window.location.assign(`/book/${savedBookId}`)}
              >
                Edit Book
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GenerationItem({
  label,
  state,
  onRetry,
}: {
  label: string;
  state: { status: PageGenerationStatus; imageUrl?: string; error?: string };
  onRetry: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative aspect-square bg-muted">
        {state.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.imageUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {state.status === "generating" && <Spinner />}
            {state.status === "pending" && (
              <span className="text-xs text-muted-foreground">Waiting</span>
            )}
            {state.status === "failed" && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs text-destructive hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-1.5">
        <span className="text-xs font-medium">{label}</span>
        <StatusBadge status={state.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PageGenerationStatus }) {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    generating: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels = { pending: "...", generating: "...", done: "\u2713", failed: "\u2717" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
