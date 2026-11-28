import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Meal Card Finder",
  description:
    "Find outlets listed for the Pluxee Meal Card in Chennai, Hyderabad, Bengaluru, and Pune.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
