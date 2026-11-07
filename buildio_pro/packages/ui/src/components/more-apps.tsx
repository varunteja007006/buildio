import { BUILDIO_APPS } from "@workspace/ui/apps";

type MoreAppsProps = {
  /** Slug of the app rendering the strip; hides that app's own pill. */
  current?: string;
};

export function MoreAppsFooter({ current }: MoreAppsProps) {
  const hub = BUILDIO_APPS.find((app) => app.slug === "web");
  const pills = BUILDIO_APPS.filter(
    (app) => app.slug !== "web" && app.slug !== current,
  );

  if (!hub) return null;

  return (
    <footer className="border-t border-neutral-500/20 px-4 py-4">
      <div className="flex flex-col items-center gap-2">
        <a
          href={hub.url}
          className="text-xs text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {hub.emoji} More from {hub.name}
        </a>
        <ul className="flex flex-wrap items-center justify-center gap-1.5">
          {pills.map((app) => (
            <li key={app.slug}>
              <a
                href={app.url}
                title={app.note}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-500/20 px-2.5 py-0.5 text-xs text-neutral-500 transition-colors hover:border-neutral-500/40 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {app.emoji ? <span aria-hidden="true">{app.emoji}</span> : null}
                {app.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export const MoreApps = MoreAppsFooter;
