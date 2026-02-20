import { BookEditor } from "@/components/BookEditor";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Edit Book</h2>
        <p className="text-muted-foreground">
          Rearrange pages, update the title, or compile your book.
        </p>
      </div>
      <BookEditor bookId={id} />
    </div>
  );
}
