"use client";


import { Calendar } from "@workspace/ui/components/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";
import * as React from "react";

import { AreaChartDemo, BarChartDemo } from "@/components/showcase/chart-demo";
import { Example, Section } from "@/components/showcase/section";

export function DataSection() {
  const [calendarDay, setCalendarDay] = React.useState<Date | undefined>(
    new Date(),
  );

  return (
    <Section
      title="Data · Display"
      description="Chart, calendar, carousel, pagination, scroll area and resizable panels."
    >
      <Example
        title="Chart (recharts)"
        description="ChartContainer + ChartTooltipContent with themed colors."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <BarChartDemo />
        <AreaChartDemo />
      </Example>

      <Example title="Calendar" contentClassName="items-start">
        <Calendar mode="single" selected={calendarDay} onSelect={setCalendarDay} className="rounded-md border" />
      </Example>

      <Example title="Carousel" className="md:col-span-2">
        <Carousel className="w-full max-w-md">
          <CarouselContent>
            {["One", "Two", "Three", "Four", "Five"].map((item) => (
              <CarouselItem key={item} className="basis-1/2 md:basis-1/3">
                <div className="flex h-24 items-center justify-center rounded-md border bg-muted text-sm">
                  Slide {item}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Example>

      <Example title="Pagination">
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Example>

      <Example title="ScrollArea" description="Vertical list and horizontal strip." contentClassName="flex-col items-stretch">
        <ScrollArea className="h-32 w-full rounded-md border p-2 text-sm">
          <div className="space-y-2 pr-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="text-muted-foreground">
                Scrollable row {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max gap-2 p-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex h-16 w-28 items-center justify-center rounded-md bg-muted text-sm"
              >
                Card {i + 1}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Example>

      <Example title="Resizable" description="react-resizable-panels with a drag handle." className="md:col-span-2">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-32 w-full rounded-md border"
        >
          <ResizablePanel defaultSize={40} className="flex items-center justify-center text-sm">
            Left
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} className="flex items-center justify-center text-sm">
            Right
          </ResizablePanel>
        </ResizablePanelGroup>
      </Example>
    </Section>
  );
}
