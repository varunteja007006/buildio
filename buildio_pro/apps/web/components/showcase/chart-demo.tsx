"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";


const monthlyData = [
  { month: "Apr", visitors: 320, signups: 90 },
  { month: "May", visitors: 540, signups: 130 },
  { month: "Jun", visitors: 410, signups: 110 },
  { month: "Jul", visitors: 680, signups: 180 },
  { month: "Aug", visitors: 760, signups: 210 },
  { month: "Sep", visitors: 920, signups: 260 },
];

const barConfig = {
  visitors: { label: "Visitors", color: "var(--primary)" },
  signups: { label: "Signups", color: "var(--chart-2, var(--muted-foreground))" },
} satisfies ChartConfig;

const areaConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1, var(--primary))" },
} satisfies ChartConfig;

export function BarChartDemo() {
  return (
    <ChartContainer config={barConfig} className="max-h-64 min-h-40 w-full">
      <BarChart accessibilityLayer data={monthlyData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function AreaChartDemo() {
  return (
    <ChartContainer config={areaConfig} className="max-h-64 min-h-40 w-full">
      <AreaChart accessibilityLayer data={monthlyData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="visitors"
          type="monotone"
          fill="var(--color-visitors)"
          fillOpacity={0.2}
          stroke="var(--color-visitors)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
