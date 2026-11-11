import { AppGrid } from "@/components/app-grid";
import { ThemeToggle } from "@/components/theme-toggle";

const GITHUB_URL = "https://github.com/varunteja007006/buildio";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Buildio.pro
          </span>
        </h1>
        <nav className="flex items-center gap-6 text-sm">
          <a
            href="#apps"
            className="text-gray-400 transition hover:text-white"
          >
            Apps
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition hover:text-white"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center text-center px-4 pt-20 pb-16">
          <h2 className="text-5xl sm:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Build Something Epic
            </span>
          </h2>
          <p className="max-w-xl text-lg text-gray-400">
            A collection of small realtime apps &amp; tools — all free, no ads.
          </p>
          <a
            href="#apps"
            className="mt-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
          >
            Explore the apps
          </a>
        </section>

        {/* Apps */}
        <section id="apps" className="mx-auto w-full max-w-4xl px-4 pb-20">
          <AppGrid />
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 p-4 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} Buildio.pro — Crafted with ❤️
      </footer>
    </div>
  );
}
