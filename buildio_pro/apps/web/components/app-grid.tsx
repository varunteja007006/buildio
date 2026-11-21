import { BUILDIO_APPS } from "@workspace/ui/apps";

export function AppGrid() {
  const apps = BUILDIO_APPS.filter((app) => app.slug !== "web");
  const liveApps = apps.filter((app) => app.note !== "source");
  const sourceApps = apps.filter((app) => app.note === "source");

  return (
    <div className="space-y-12">
      <AppGroup title="Live apps" apps={liveApps} />
      <AppGroup title="Source code" apps={sourceApps} />
    </div>
  );
}

function AppGroup({
  title,
  apps,
}: {
  title: string;
  apps: typeof BUILDIO_APPS;
}) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-4 text-xl font-semibold text-white"
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {apps.map((app) => {
          const isSourceOnly = app.note === "source";

          return (
            <a
              key={app.slug}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full min-h-52 flex-col rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <span className="block text-3xl" aria-hidden="true">
                {app.emoji}
              </span>
              <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold text-white">
                {app.name}
                {app.note && !isSourceOnly ? (
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs font-normal text-gray-400">
                    {app.note}
                  </span>
                ) : null}
              </h3>
              {app.description ? (
                <p className="mt-1 text-sm text-gray-300">{app.description}</p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-purple-300 transition group-hover:text-purple-200">
                {isSourceOnly ? "View source" : "Open app"}
                <span aria-hidden="true">↗</span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
