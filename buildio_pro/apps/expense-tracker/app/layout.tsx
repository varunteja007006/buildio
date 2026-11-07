import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { Toaster } from "@workspace/ui/components/sonner";
import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";

import { appConfig } from "@/app/appConfig";
import { Providers } from "@/components/providers";

import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = DM_Sans({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description:
    "Track your expenses, income, and budgets with ease. Free forever, no credit card required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <MoreAppsFooter current="expense-tracker" />
        <Toaster />
      </body>
    </html>
  );
}
