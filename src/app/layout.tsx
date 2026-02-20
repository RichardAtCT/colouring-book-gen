import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { AuthButton } from "@/components/AuthButton";
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
        <Providers>
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-semibold">
                  Colouring Book Generator
                </Link>
                <nav className="flex items-center gap-4 text-sm">
                  <Link
                    href="/gallery"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Gallery
                  </Link>
                  <Link
                    href="/books"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Books
                  </Link>
                  <Link
                    href="/templates"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Templates
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </nav>
              </div>
              <AuthButton />
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
