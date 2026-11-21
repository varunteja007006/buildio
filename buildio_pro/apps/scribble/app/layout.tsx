import { Toaster } from "@workspace/ui/components/sonner";
import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Scribble",
  description: "Build something epic. Scribble",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Scribble" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <SiteShell>{children}</SiteShell>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
