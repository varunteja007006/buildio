import {
  PageTransition,
} from "@workspace/ui/components/animate-ui/components/page-transition";
import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { Toaster } from "@workspace/ui/components/sonner";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";

import "./globals.css";

const nunito = Nunito({
  variable: "--font-cozy",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

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
      <body className={`${nunito.variable} font-sans antialiased`}>
        <Providers>
          <main className="min-h-screen bg-secondary">
            <div className="p-2 md:p-4">
              <section className="sm:min-h-[calc(100svh-5rem)] min-h-[calc(100svh-3rem)] rounded-lg border border-border bg-background p-2 md:py-6 md:px-4">
                <Navbar />
                <PageTransition effect="stack">{children}</PageTransition>
              </section>
            </div>
          </main>
          <div className="pt-0 pb-4 px-2 md:pb-8 md:pt-0 md:px-4 bg-secondary">
            <div className="bg-background py-5 rounded-lg border border-border">
              <MoreAppsFooter current="secret-santa" />
            </div>
          </div>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
