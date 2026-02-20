"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateSinglePagePdf } from "@/lib/pdf-client";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  ageRange: string;
  quality: string;
  isFavourite: boolean;
  createdAt: string;
}

interface ImageModalProps {
  generation: Generation;
  onClose: () => void;
  onToggleFavourite: () => void;
  onDelete: () => void;
}

export function ImageModal({
  generation,
  onClose,
  onToggleFavourite,
  onDelete,
}: ImageModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleDownloadPng = () => {
    const link = document.createElement("a");
    link.href = generation.imageUrl;
    link.download = `colouring-page-${generation.id}.png`;
    link.target = "_blank";
    link.click();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generateSinglePagePdf(generation.imageUrl, "A4");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `colouring-page-${generation.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error("PDF generation failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-2 right-2 rounded-full bg-muted p-2 text-sm"
          onClick={onClose}
        >
          &#x2715;
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generation.imageUrl}
          alt={generation.prompt}
          className="w-full rounded-lg"
        />

        <div className="mt-4 space-y-3">
          <p className="text-sm">
            <span className="font-medium">Prompt:</span> {generation.prompt}
          </p>
          <p className="text-xs text-muted-foreground">
            Age range: {generation.ageRange} &middot; Quality:{" "}
            {generation.quality} &middot;{" "}
            {new Date(generation.createdAt).toLocaleDateString()}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPng}>
              Download PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onToggleFavourite}>
              {generation.isFavourite ? "Unfavourite" : "Favourite"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this generation?")) onDelete();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
