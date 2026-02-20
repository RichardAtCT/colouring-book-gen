import { BookGenerator } from "@/components/BookGenerator";

export default function GenerateBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate a Colouring Book</h1>
        <p className="text-muted-foreground">
          Describe your book concept and we&apos;ll create all the pages for you.
        </p>
      </div>
      <BookGenerator />
    </div>
  );
}
