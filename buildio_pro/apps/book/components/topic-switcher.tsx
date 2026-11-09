"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { useMutation, useQuery } from "convex/react";
import { BookHeartIcon, ChevronsUpDown, Plus, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AddTopicDialog } from "@/components/add-topic-dialog";
import { DeleteTopicDialog } from "@/components/delete-topic-dialog";

const ACTIVE_TOPIC_STORAGE_KEY = "book:active-topic";

export function TopicSwitcher() {
  const { isMobile } = useSidebar();
  const topics = useQuery(api.bookTopics.list);
  const ensureDefault = useMutation(api.bookTopics.ensureDefault);
  const setFavorite = useMutation(api.bookTopics.setFavorite);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<{
    id: Id<"book_topics">;
    name: string;
  } | null>(null);

  const toggleFavorite = useCallback(
    (topicId: Id<"book_topics">, favorite: boolean) => {
      void setFavorite({ id: topicId, favorite }).catch((error) => {
        console.error("Failed to update topic favorite", error);
      });
    },
    [setFavorite],
  );

  // Selected topic persists in localStorage; missing/stale ids fall back to null.
  const [activeTopicId, setActiveTopicId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_TOPIC_STORAGE_KEY);
  });

  // Set while a delete is opening so the row's onSelect does not also select.
  const suppressSelectRef = useRef(false);

  const activeTopic = topics?.find((topic) => topic.id === activeTopicId);

  const selectTopic = useCallback((topicId: string) => {
    setActiveTopicId(topicId);
    window.localStorage.setItem(ACTIVE_TOPIC_STORAGE_KEY, topicId);
  }, []);

  const topicsLoaded = topics !== undefined;
  const hasDefault = topics?.some((topic) => topic.isDefault) ?? false;

  // Auto-create the default topic when it is missing — covers the empty case
  // and legacy topics predating the is_default flag.
  useEffect(() => {
    if (topicsLoaded && !hasDefault) {
      void ensureDefault();
    }
  }, [topicsLoaded, hasDefault, ensureDefault]);

  // Restore a resolvable selection; otherwise auto-select the default topic
  // (or the first topic) after the list loads. Never overrides a user
  // selection that still resolves.
  useEffect(() => {
    if (!topicsLoaded) {
      return;
    }
    if (activeTopicId && topics?.some((topic) => topic.id === activeTopicId)) {
      return;
    }
    const fallback = topics?.find((topic) => topic.isDefault) ?? topics?.[0];
    if (fallback) {
      selectTopic(fallback.id);
    }
  }, [topicsLoaded, topics, activeTopicId, selectTopic]);

  const requestDeleteTopic = (topic: {
    id: Id<"book_topics">;
    name: string;
  }) => {
    suppressSelectRef.current = true;
    setTopicToDelete(topic);
  };

  const handleDeleted = (deletedTopicId: string) => {
    if (activeTopicId === deletedTopicId) {
      // Clear the selection; the fallback effect re-selects (and persists)
      // the default topic or the first remaining one.
      setActiveTopicId(null);
      window.localStorage.removeItem(ACTIVE_TOPIC_STORAGE_KEY);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="p-0!">
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) {
              // A previous interaction may have left the suppress flag set.
              suppressSelectRef.current = false;
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BookHeartIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Book</span>
                <span className="truncate text-xs">
                  {activeTopic?.name ?? "Second Brain"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Topics
            </DropdownMenuLabel>
            {topics?.map((topic, index) => (
              <DropdownMenuItem
                key={topic.id}
                onSelect={(event) => {
                  if (suppressSelectRef.current) {
                    suppressSelectRef.current = false;
                    event.preventDefault();
                    return;
                  }
                  selectTopic(topic.id);
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <BookHeartIcon className="size-3.5 shrink-0" />
                </div>
                {topic.name}
                <button
                  type="button"
                  aria-label={`${topic.isFavorite ? "Unfavorite" : "Favorite"} topic ${topic.name}`}
                  className={`rounded-sm p-0.5 opacity-60 transition-colors hover:opacity-100 focus-visible:outline-visible ${
                    topic.isFavorite
                      ? "text-amber-500"
                      : "text-muted-foreground hover:text-amber-500"
                  }`}
                  onClick={(event) => {
                    // Keep this click from selecting the topic.
                    event.stopPropagation();
                    toggleFavorite(topic.id, !topic.isFavorite);
                  }}
                  onKeyDown={(event) => {
                    // Keep Enter/Space from also selecting the topic.
                    event.stopPropagation();
                  }}
                >
                  <Star
                    className={`size-3.5 ${topic.isFavorite ? "fill-current" : ""}`}
                  />
                </button>
                {topic.isDefault ? null : (
                  <button
                    type="button"
                    aria-label={`Delete topic ${topic.name}`}
                    className="rounded-sm p-0.5 text-muted-foreground opacity-60 transition-colors hover:text-destructive hover:opacity-100 focus-visible:outline-visible"
                    onClick={(event) => {
                      // Keep this click from selecting the topic.
                      event.stopPropagation();
                      requestDeleteTopic(topic);
                    }}
                    onKeyDown={(event) => {
                      // Keep Enter/Space from also selecting the topic.
                      event.stopPropagation();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setAddTopicOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Topic</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <AddTopicDialog
        open={addTopicOpen}
        onOpenChange={setAddTopicOpen}
        onCreated={selectTopic}
      />
      <DeleteTopicDialog
        topic={topicToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTopicToDelete(null);
          }
        }}
        onDeleted={handleDeleted}
      />
    </SidebarMenu>
  );
}
