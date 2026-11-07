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
          <div className="md:max-w-6xl w-full mx-auto">
            <Navbar />
            <main className="min-h-[(calc(100vh-20rem))]">{children}</main>
          </div>
          <MoreAppsFooter current="secret-santa" />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
