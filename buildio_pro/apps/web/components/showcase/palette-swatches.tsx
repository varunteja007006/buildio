import { Example, Section } from "@/components/showcase/section";

const surfaces = [
  ["Background", "bg-background text-foreground"],
  ["Card", "bg-card text-card-foreground"],
  ["Popover", "bg-popover text-popover-foreground"],
  ["Primary", "bg-primary text-primary-foreground"],
  ["Secondary", "bg-secondary text-secondary-foreground"],
  ["Muted", "bg-muted text-muted-foreground"],
  ["Accent", "bg-accent text-accent-foreground"],
  ["Destructive", "bg-destructive text-destructive-foreground"],
  ["Sidebar", "bg-sidebar text-sidebar-foreground"],
];

const chartColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export function PaletteSwatches() {
  return (
    <Section title="Theme colors">
      <Example title="Surfaces" contentClassName="gap-2">
        {surfaces.map(([label, colors]) => (
          <span
            key={label}
            className={`rounded-md border px-3 py-2 text-sm ${colors}`}
          >
            {label}
          </span>
        ))}
      </Example>
      <Example title="Chart colors" contentClassName="gap-3">
        {chartColors.map((color, index) => (
          <div key={color} className="space-y-1 text-center text-xs">
            <div className={`size-8 rounded-md border ${color}`} />
            {index + 1}
          </div>
        ))}
      </Example>
    </Section>
  );
}
