import type { Metadata } from "next";
import { Comic_Neue } from "next/font/google";
import { Toaster } from "@workspace/ui/components/sonner";
import { Footer } from "./_components/footer/Footer";
import { Navbar } from "./_components/nav/Navbar";
import BloomContainer from "@/components/bloom-container";
import { Providers } from "@/components/providers";
import "@workspace/ui/globals.css"

const comicNeue = Comic_Neue({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Varun Teja K",
  description: "varunteja007006@gmail.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comicNeue.className} scroll-smooth antialiased`}>
        <Providers>
          <BloomContainer>
            <div className="flex min-h-screen w-full flex-col">
              <Navbar />
              <div className="flex-1 p-4">{children}</div>
              <Footer />
            </div>
          </BloomContainer>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
