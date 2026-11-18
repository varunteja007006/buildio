import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import type { ComponentProps } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";

const chartConfig = {
  value: {
    label: "Votes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function PokerResultChart({
  chartData,
}: Readonly<{
  chartData: {
    name: string;
    value: number;
  }[];
}>) {
  const maxVotes = Math.max(...chartData.map(({ value }) => value));

  return (
    <ChartContainer
      className="h-[240px] w-full max-w-xl min-w-0 mx-auto"
      config={chartConfig}
    >
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fontWeight: 700, fontSize: 14 }}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              payload={
                chartData as unknown as ComponentProps<
                  typeof ChartTooltipContent
                >["payload"]
              }
              active
              hideLabel
            />
          }
        />
        <Bar dataKey="value" radius={8}>
          {chartData.map(({ name, value }) => (
            <Cell
              key={name}
              fill={value === maxVotes ? "var(--primary)" : "var(--secondary)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
