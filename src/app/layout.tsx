import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colouring Book Generator",
  description:
    "Generate custom children's colouring book pages with AI. Type a description and get print-ready line art in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
            <h1 className="text-lg font-semibold">Colouring Book Generator</h1>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
