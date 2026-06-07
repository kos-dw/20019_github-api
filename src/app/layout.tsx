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
  title: "GitHub リポジトリ検索",
  description: "GitHub API を使ったリポジトリ検索アプリ",
  openGraph: {
    title: "GitHub リポジトリ検索",
    description: "GitHub API を使ったリポジトリ検索アプリ",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:border-2 focus:border-blue-600 focus:bg-white focus:p-3 focus:text-blue-600"
        >
          メインコンテンツへスキップ
        </a>
        <header className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">
            <Link href="/">GitHub リポジトリ検索</Link>
          </h1>
          <hr className="my-4" />
        </header>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
