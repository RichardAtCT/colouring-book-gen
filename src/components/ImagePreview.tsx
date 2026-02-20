"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSinglePagePdf } from "@/lib/pdf-client";

interface ImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
}

export function ImagePreview({ imageUrl, isLoading }: ImagePreviewProps) {
  if (isLoading) {
    return (
      <Card className="flex aspect-square items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-64 w-64 rounded-lg" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
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
            Generating your colouring page...
          </div>
        </div>
      </Card>
    );
  }

  if (!imageUrl) {
    return (
      <Card className="flex aspect-square items-center justify-center p-4 border-dashed">
        <p className="text-center text-sm text-muted-foreground">
          Your colouring page will appear here
        </p>
      </Card>
    );
  }

  const handleDownloadPng = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `colouring-page-${Date.now()}.png`;
    link.click();
  };

  const handlePrint = () => {
    const w = window.open("");
    if (!w) return;
    w.document.write(`<img src="${imageUrl}" onload="window.print();window.close()" style="max-width:100%" />`);
    w.document.close();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generateSinglePagePdf(imageUrl, "A4");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `colouring-page-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error("PDF generation failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Generated colouring page"
          className="w-full"
        />
      </Card>
      <div className="flex gap-2">
        <Button onClick={handleDownloadPng} variant="outline" className="flex-1">
          Download PNG
        </Button>
        <Button onClick={handleDownloadPdf} className="flex-1">
          Download PDF
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          Print
        </Button>
      </div>
    </div>
  );
}
