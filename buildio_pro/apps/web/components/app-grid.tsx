import { BUILDIO_APPS } from "@workspace/ui/apps";

export function AppGrid() {
  const apps = BUILDIO_APPS.filter((app) => app.slug !== "web");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <a
          key={app.slug}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10"
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl" aria-hidden="true">
              {app.emoji}
            </span>
            <span
              aria-hidden="true"
              className="text-gray-600 transition group-hover:text-gray-300"
            >
              ↗
            </span>
          </div>
          <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold text-white">
            {app.name}
            {app.note ? (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs font-normal text-gray-400">
                {app.note}
              </span>
            ) : null}
          </h3>
          {app.description ? (
            <p className="mt-1 text-sm text-gray-400">{app.description}</p>
          ) : null}
        </a>
      ))}
    </div>
  );
}
