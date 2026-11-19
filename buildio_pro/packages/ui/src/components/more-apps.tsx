"use client";

import { BUILDIO_APPS } from "@workspace/ui/apps";
import { motion } from "motion/react";

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
    <motion.footer
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="px-4 py-10"
    >
      <div className="flex flex-col items-center gap-3">
        <a
          href={hub.url}
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {hub.emoji} More from {hub.name}
        </a>
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {pills.map((app) => (
            <li key={app.slug}>
              <a
                href={app.url}
                title={app.note}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-500/20 px-3.5 py-1.5 text-sm text-neutral-500 transition-colors hover:border-neutral-500/40 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {app.emoji ? <span aria-hidden="true">{app.emoji}</span> : null}
                {app.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.footer>
  );
}

export const MoreApps = MoreAppsFooter;