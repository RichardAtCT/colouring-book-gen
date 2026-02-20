import { GalleryGrid } from "@/components/GalleryGrid";

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">My Gallery</h2>
        <p className="text-muted-foreground">
          Browse your previously generated colouring pages.
        </p>
      </div>
      <GalleryGrid />
    </div>
  );
}
