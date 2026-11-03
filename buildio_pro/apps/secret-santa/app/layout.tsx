import { Toaster } from "@workspace/ui/components/sonner";
import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Santa",
  description: "Build something epic. Secret Santa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Secret Santa" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-[(calc(100vh-20rem))]">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
