import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Providers } from "@/components/Providers";
import { NavLinks } from "@/components/NavLinks";
import Link from "next/link";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crayon Magic - Colouring Book Generator",
  description:
    "Generate custom children's colouring book pages with AI. Type a description and get print-ready line art in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <Providers>
          <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                  <span className="text-xl">🖍️</span>
                  <span className="bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text font-display font-bold text-transparent">
                    Crayon Magic
                  </span>
                </Link>
                <NavLinks />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
