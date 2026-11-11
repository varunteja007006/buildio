"use client";


import { Button } from "@workspace/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@workspace/ui/components/menubar";
import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  PrinterIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from "lucide-react";
import * as React from "react";

import { Example, Section } from "@/components/showcase/section";

export function OverlaysMenusSection() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [showLineNumbers] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Section
      title="Menus & Command"
      description="Dropdown, context, menubar and the cmdk command palette."
    >
      <Example title="DropdownMenu" description="Items, checkbox items, shortcuts and groups.">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={notifications}
              onCheckedChange={(value) => setNotifications(Boolean(value))}
            >
              Notifications
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showLineNumbers}>
              Line numbers
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => undefined}>
              <UserIcon />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <CreditCardIcon />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => undefined}>
              Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Example>

      <Example title="ContextMenu" description="Right-click the dashed area.">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-28 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Right click here
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuItem inset onSelect={() => undefined}>
              <SettingsIcon />
              Preferences
            </ContextMenuItem>
            <ContextMenuCheckboxItem checked={showLineNumbers}>
              Line numbers
            </ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuItem inset onSelect={() => undefined}>
              <PrinterIcon />
              Print
              <ContextMenuShortcut>⌘P</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Example>

      <Example title="Menubar" contentClassName="flex-col items-stretch">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={() => undefined}>
                New tab
                <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>Open…</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={() => undefined}>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={() => undefined}>
                Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={() => undefined}>
                Redo
                <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Example>

      <Example
        title="Command"
        description="Inline palette plus CommandDialog (⌘K or the button)."
        contentClassName="flex-col items-stretch"
      >
        <Button
          variant="outline"
          className="justify-start text-muted-foreground"
          onClick={() => setCommandOpen(true)}
        >
          Search commands… <CommandShortcut className="ml-auto">⌘K</CommandShortcut>
        </Button>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => setCommandOpen(false)}>
                <CalculatorIcon />
                Calculate
              </CommandItem>
              <CommandItem onSelect={() => setCommandOpen(false)}>
                <CalendarIcon />
                Calendar
              </CommandItem>
              <CommandItem onSelect={() => setCommandOpen(false)}>
                <SmileIcon />
                Search emoji
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </Example>
    </Section>
  );
}
