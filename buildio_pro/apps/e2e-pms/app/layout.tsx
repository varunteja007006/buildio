import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "E2E PMS",
  description: "Project and task overview",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-content">
            <Link className="brand" href="/">
              E2E PMS
            </Link>
            <nav aria-label="Main navigation">
              <Link href="/">Dashboard</Link>
              <Link href="/tasks">Tasks</Link>
            </nav>
          </div>
        </header>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
