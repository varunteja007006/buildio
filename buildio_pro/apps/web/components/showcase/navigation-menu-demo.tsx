"use client";


import { Button } from "@workspace/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import { Separator } from "@workspace/ui/components/separator";
import { BellIcon, HomeIcon, SearchIcon, SettingsIcon } from "lucide-react";

const components = [
  { title: "Overlays", href: "#", description: "Dialogs, sheets, drawers and popovers." },
  { title: "Data", href: "#", description: "Tables, charts, calendars and carousels." },
  { title: "Feedback", href: "#", description: "Toasts, progress and empty states." },
];

export function NavigationMenuDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <NavigationMenu className="w-fit">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Overview</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-72 gap-2 p-4">
                {components.map((item) => (
                  <NavigationMenuLink
                    key={item.title}
                    href={item.href}
                    className="block rounded-md p-2 transition-colors hover:bg-accent"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </NavigationMenuLink>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#"
              className={navigationMenuTriggerStyle()}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#"
              className={navigationMenuTriggerStyle()}
            >
              Registry
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport className="left-0" />
      </NavigationMenu>

      <Separator className="w-full max-w-xs" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button size="icon-sm" variant="ghost" aria-label="Home">
          <HomeIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Search">
          <SearchIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Notifications">
          <BellIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Settings">
          <SettingsIcon />
        </Button>
      </div>
    </div>
  );
}
