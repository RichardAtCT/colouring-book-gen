"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageModal } from "@/components/ImageModal";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  ageRange: string;
  quality: string;
  isFavourite: boolean;
  costUsd: number | null;
  provider: string;
  createdAt: string;
}

interface GalleryResponse {
  items: Generation[];
  page: number;
  totalPages: number;
  total: number;
}

export function GalleryGrid() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [selectedGeneration, setSelectedGeneration] =
    useState<Generation | null>(null);

  const fetchGenerations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(favouritesOnly && { favourites: "true" }),
      });
      const response = await fetch(`/api/gallery?${params}`);
      if (response.ok) {
        const data: GalleryResponse = await response.json();
        setGenerations(data.items);
        setTotalPages(data.totalPages);
      }
    } catch {
      console.error("Failed to fetch gallery");
    } finally {
      setIsLoading(false);
    }
  }, [page, favouritesOnly]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const toggleFavourite = async (id: string, current: boolean) => {
    await fetch("/api/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isFavourite: !current }),
    });
    setGenerations((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isFavourite: !current } : g))
    );
  };

  const deleteGeneration = async (id: string) => {
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    setSelectedGeneration(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <span className="text-5xl">
          {favouritesOnly ? "\u2764\uFE0F" : "\uD83C\uDFA8"}
        </span>
        <h3 className="font-display text-xl font-bold text-foreground">
          {favouritesOnly ? "No favourites yet" : "No creations yet"}
        </h3>
        <p className="text-muted-foreground">
          {favouritesOnly
            ? "Heart a generation to save it here."
            : "Create your first colouring page to get started!"}
        </p>
        {!favouritesOnly && (
          <Button asChild>
            <Link href="/">Create a Page</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setFavouritesOnly(false);
            setPage(1);
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !favouritesOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            setFavouritesOnly(true);
            setPage(1);
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            favouritesOnly
              ? "bg-chart-4 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Favourites
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {generations.map((gen) => (
          <Card
            key={gen.id}
            className="group relative cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setSelectedGeneration(gen)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gen.thumbnailUrl ?? gen.imageUrl}
              alt={gen.prompt}
              className="aspect-square w-full object-cover"
            />
            <button
              type="button"
              className="absolute top-2 right-2 rounded-full bg-white/80 p-1 text-lg opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavourite(gen.id, gen.isFavourite);
              }}
            >
              {gen.isFavourite ? "\u2764\uFE0F" : "\uD83E\uDD0D"}
            </button>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selectedGeneration && (
        <ImageModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
          onToggleFavourite={() =>
            toggleFavourite(
              selectedGeneration.id,
              selectedGeneration.isFavourite
            )
          }
          onDelete={() => deleteGeneration(selectedGeneration.id)}
        />
      )}
    </>
  );
}
