import { BookEditor } from "@/components/BookEditor";

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Create a Colouring Book
        </h2>
        <p className="text-muted-foreground">
          Select pages from your gallery, arrange them, and compile into a
          printable PDF book.
        </p>
      </div>
      <BookEditor />
    </div>
  );
}
