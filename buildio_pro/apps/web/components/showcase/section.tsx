import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";


type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mb-16">
      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

type ExampleProps = {
  title: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function Example({
  title,
  description,
  className,
  contentClassName,
  children,
}: ExampleProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 text-card-foreground shadow-xs",
        className,
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("flex flex-wrap items-center gap-3", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
