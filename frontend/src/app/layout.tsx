import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RioClubs Stats",
  description: "Dashboard comparativo dos times cariocas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 px-6 py-4">
          <nav className="mx-auto flex max-w-4xl gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-emerald-400">
              RioClubs Stats
            </Link>
            <Link href="/classificacao" className="text-neutral-400 hover:text-emerald-400">
              Classificação
            </Link>
            <Link href="/comparar" className="text-neutral-400 hover:text-emerald-400">
              Comparar
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
