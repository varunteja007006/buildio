import type { ReactNode } from "react";

import {
  AppBreadcrumb,
  type BreadcrumbSegment,
} from "@/components/app-breadcrumb";

type PageHeaderProps = {
  segments: BreadcrumbSegment[];
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions rendered beside the title row. */
  actions?: ReactNode;
};

/**
 * Shared page heading: breadcrumb trail, page title, and muted description,
 * with optional right-aligned actions.
 */
export function PageHeader({
  segments,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <>
      <AppBreadcrumb segments={segments} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </>
  );
}
