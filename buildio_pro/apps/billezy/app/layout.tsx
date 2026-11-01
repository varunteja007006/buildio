import { Button } from "@workspace/ui/components/button";
import { Toaster } from "@workspace/ui/components/sonner";
import { ExternalLink, House } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Billezy",
  description: "Split bills for shared group expenses. See who owes whom.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Billezy",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Billezy" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-3 pt-3 sm:px-4">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-2"
            >
              <Button asChild variant="ghost" size="sm">
                <Link href="/" aria-label="Billezy home">
                  <House aria-hidden="true" /> Billezy
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/" target="_blank" rel="noopener noreferrer">
                  New split <ExternalLink aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </nav>
            <ThemeToggle />
          </header>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
