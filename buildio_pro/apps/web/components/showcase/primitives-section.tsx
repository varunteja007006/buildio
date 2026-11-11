"use client";


import { AspectRatio } from "@workspace/ui/components/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@workspace/ui/components/item";
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd";
import { Marker, MarkerContent, MarkerIcon } from "@workspace/ui/components/marker";
import { RelativeTime } from "@workspace/ui/components/relative-time";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CircleIcon } from "lucide-react";

import { Example, Section } from "@/components/showcase/section";

export function PrimitivesSection() {
  return (
    <Section
      title="Primitives"
      description="Buttons, badges, cards, avatars, and small building blocks."
    >
      <Example title="Button" description="Variants (default, secondary, destructive, outline, ghost, link).">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Example>

      <Example title="Button sizes & icons" description="xs / sm / default / lg plus icon-only sizes.">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Icon button">
          <CircleIcon />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Small icon button">
          <CircleIcon />
        </Button>
      </Example>

      <Example title="Badge" description="default, secondary, destructive, outline, ghost, link.">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </Example>

      <Example title="Card">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description text.</CardDescription>
          </CardHeader>
          <CardContent>Card content goes here.</CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>
      </Example>

      <Example title="Avatar" description="Image with letter fallback; supports AvatarGroup.">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>VR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">UI</AvatarFallback>
        </Avatar>
      </Example>

      <Example title="Item" description="Flexible list row with media, content and actions.">
        <div className="w-full">
          <Item variant="outline">
            <ItemMedia variant="icon">🎨</ItemMedia>
            <ItemContent>
              <ItemTitle>Design tokens</ItemTitle>
              <ItemDescription>Theme variables shared across every app.</ItemDescription>
            </ItemContent>
            <ItemActionsDemo />
          </Item>
        </div>
      </Example>

      <Example title="Kbd & Marker" description="Keyboard hints and text markers (default, separator, border).">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Marker>
          <MarkerIcon>🚀</MarkerIcon>
          <MarkerContent>Deploy preview ready</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Divider marker</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerContent>Border marker</MarkerContent>
        </Marker>
      </Example>

      <Example title="Separator, Skeleton & AspectRatio" contentClassName="flex-col items-stretch">
        <div className="flex items-center gap-3 text-sm">
          <span>Left</span>
          <Separator className="flex-1" />
          <span>Right</span>
        </div>
        <div className="flex w-full items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <AspectRatio ratio={16 / 9} className="rounded-md bg-muted">
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            16 / 9 aspect ratio
          </div>
        </AspectRatio>
      </Example>

      <Example title="RelativeTime" description="Self-updating relative phrase.">
        <RelativeTime date={new Date(Date.now() - 2 * 60 * 1000)} />
        <RelativeTime date={new Date(Date.now() - 5 * 60 * 60 * 1000)} prefix="Synced" />
      </Example>
    </Section>
  );
}

function ItemActionsDemo() {
  return (
    <Button variant="ghost" size="icon-xs" aria-label="Configure item">
      <CircleIcon />
    </Button>
  );
}
