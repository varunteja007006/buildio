import { AppGrid } from "@/components/app-grid";

const GITHUB_URL = "https://github.com/varunteja007006/buildio";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <p className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Buildio.pro
          </span>
        </p>
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
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center px-4 pt-12 pb-10 text-center sm:pt-14">
          <h1 className="mb-3 text-4xl font-extrabold sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Free apps for work and play
            </span>
          </h1>
          <p className="max-w-xl text-base text-gray-300 sm:text-lg">
            Realtime tools and games, all free and ad-free.
          </p>
        </section>

        {/* Apps */}
        <section id="apps" className="mx-auto w-full max-w-7xl px-4 pb-16">
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
