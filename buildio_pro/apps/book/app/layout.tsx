import type { Metadata, Viewport } from "next";

import "./globals.css";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Book",
  description: "A Buildio.pro app.",
};

export const viewport: Viewport = {
  themeColor: "oklch(0.2683 0.0279 150.7681)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
