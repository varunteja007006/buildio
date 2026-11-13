"use client";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@workspace/ui/components/action-bar";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@workspace/ui/components/button-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Toggle } from "@workspace/ui/components/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  BoldIcon,
  ChevronRightIcon,
  ItalicIcon,
  UnderlineIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

import { NavigationMenuDemo } from "@/components/showcase/navigation-menu-demo";
import { Example, Section } from "@/components/showcase/section";
import { TabsDemo } from "@/components/showcase/tabs-demo";

export function NavigationSection() {
  const [actionBarOpen, setActionBarOpen] = React.useState(false);

  return (
    <Section
      title="Navigation"
      description="Accordion, collapsible, tabs, breadcrumb, navigation menu, toggles, button group and action bar."
    >
      <Example title="Accordion" contentClassName="flex-col items-stretch">
        <Accordion className="w-full">
          <AccordionItem value="a">
            <AccordionTrigger>What is @workspace/ui?</AccordionTrigger>
            <AccordionContent>
              A shared shadcn-style component registry consumed by every app in
              the monorepo.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I contribute a component?</AccordionTrigger>
            <AccordionContent>
              Add it under packages/ui/src/components and it becomes available
              everywhere via the exports map.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Example>

      <Example title="Collapsible" contentClassName="flex-col items-stretch">
        <Collapsible className="w-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">Show advanced settings</span>
            <CollapsibleTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="Toggle settings">
                  <ChevronRightIcon />
                </Button>
              }
            />
          </div>
          <CollapsibleContent className="mt-2 rounded-md border p-3 text-sm text-muted-foreground">
            Hidden panel content — toggled without unmounting.
          </CollapsibleContent>
        </Collapsible>
      </Example>

      <Example title="Tabs" className="md:col-span-2" contentClassName="flex-col items-stretch">
        <TabsDemo />
      </Example>

      <Example title="Breadcrumb" contentClassName="flex-col items-stretch">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Example>

      <Example title="NavigationMenu" className="md:col-span-2" contentClassName="flex-col items-stretch">
        <NavigationMenuDemo />
      </Example>

      <Example title="Toggle & ToggleGroup" description="Single toggles and exclusive group.">
        <Toggle aria-label="Toggle bold">
          <BoldIcon />
        </Toggle>
        <ToggleGroup multiple variant="outline">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Example>

      <Example title="ButtonGroup & ActionBar" contentClassName="flex-col items-stretch">
        <ButtonGroup>
          <Button variant="outline">Draft</Button>
          <Button variant="outline">Preview</Button>
          <ButtonGroupText className="gap-1.5 text-muted-foreground">
            v2.1
          </ButtonGroupText>
        </ButtonGroup>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => setActionBarOpen((open) => !open)}
          >
            {actionBarOpen ? "Hide" : "Show"} action bar
          </Button>
          <ActionBar
            open={actionBarOpen}
            onOpenChange={setActionBarOpen}
            className="text-sm"
          >
            <ActionBarGroup>
              <ActionBarSelection>3 rows selected</ActionBarSelection>
            </ActionBarGroup>
            <ActionBarSeparator />
            <ActionBarGroup>
              <ActionBarItem onClick={() => undefined}>Archive</ActionBarItem>
              <ActionBarItem onClick={() => undefined}>Delete</ActionBarItem>
            </ActionBarGroup>
            <ActionBarClose aria-label="Close action bar">
              <XIcon />
            </ActionBarClose>
          </ActionBar>
        </div>
      </Example>
    </Section>
  );
}
