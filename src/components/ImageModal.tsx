"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSinglePagePdf } from "@/lib/pdf-client";
import { formatCost } from "@/lib/costs";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  ageRange: string;
  quality: string;
  isFavourite: boolean;
  costUsd: number | null;
  provider: string;
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

  const handlePrint = () => {
    const w = window.open("");
    if (!w) return;
    w.document.write(`<img src="${generation.imageUrl}" onload="window.print();window.close()" style="max-width:100%" />`);
    w.document.close();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border-t-4 border-primary bg-background p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 rounded-full bg-muted p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
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
            {generation.provider && <> &middot; {generation.provider}</>}
            {generation.costUsd != null && <> &middot; {formatCost(generation.costUsd)}</>}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPng}>
              Download PNG
            </Button>
            <Button size="sm" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Print
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
