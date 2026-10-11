"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import * as React from "react";

import {
  useActivateWorkspace,
  useCreateWorkspace,
  useWorkspaces,
} from "@/api/workspaces/query";
import { CharCount } from "@/components/char-count";
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from "@/lib/text-limits";
import { cn } from "@/lib/utils";

function getWorkspaceInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const { data, isLoading } = useWorkspaces();
  const activate = useActivateWorkspace();
  const create = useCreateWorkspace();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const workspaces = (data?.workspaces ?? []).filter((w) => !w.deletedAt);
  const activeWorkspace =
    workspaces.find((w) => w.id === data?.activeWorkspaceId) ??
    workspaces.find((w) => w.isActive) ??
    workspaces[0];

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setDialogOpen(false);
        },
      },
    );
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isLoading ? (
          <SidebarMenuButton size="lg">
            <Skeleton className="aspect-square size-8 rounded-lg" />
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        ) : !activeWorkspace ? (
          <SidebarMenuButton
            size="lg"
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <SparklesIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Cortex AI</span>
              <span className="truncate text-xs text-muted-foreground">
                Create workspace
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </SidebarMenuButton>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Cortex AI</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeWorkspace.name}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-fit min-w-52"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => {
                  const isActive = workspace.id === activeWorkspace?.id;
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => !isActive && activate.mutate(workspace.id)}
                      className="gap-2 p-2"
                      disabled={activate.isPending}
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-medium">
                        {getWorkspaceInitials(workspace.name)}
                      </div>
                      <span className="min-w-0 flex-1 truncate">
                        {workspace.name}
                      </span>
                      <CheckIcon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </DropdownMenuItem>
                  );
                })}
                {workspaces.length === 0 && (
                  <DropdownMenuItem
                    disabled
                    className="p-2 text-muted-foreground"
                  >
                    No workspaces yet
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <PlusIcon className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Create workspace
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Workspaces group topics, folders and documents into separate
              projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g. Client Portal"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <CharCount value={name} maxLength={NAME_MAX_LENGTH} />
            <Label htmlFor="workspace-description">Description</Label>
            <Input
              id="workspace-description"
              placeholder="Optional"
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <CharCount
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
            />
            {create.isError && (
              <p className="text-xs text-destructive">
                {create.error?.message ?? "Could not create workspace."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  );
}
