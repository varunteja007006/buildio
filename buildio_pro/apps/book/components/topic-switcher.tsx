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
import {
  BookHeartIcon,
  ChevronsUpDown,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { AddTopicDialog } from "@/components/add-topic-dialog";
import { DeleteTopicDialog } from "@/components/delete-topic-dialog";
import { useActiveTopic } from "@/components/topic-provider";

export function TopicSwitcher() {
  const { isMobile } = useSidebar();
  const topics = useQuery(api.bookTopics.list);
  const setFavorite = useMutation(api.bookTopics.setFavorite);
  const { setActiveTopicId, topic: activeTopic } = useActiveTopic();
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

  // Set while a delete is opening so the row's click does not also select.
  const suppressSelectRef = useRef(false);

  const requestDeleteTopic = (topic: {
    id: Id<"book_topics">;
    name: string;
  }) => {
    suppressSelectRef.current = true;
    setTopicToDelete(topic);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="p-0!">
        <DropdownMenu
          onOpenChange={(open, eventDetails) => {
            if (open) {
              // A previous interaction may have left the suppress flag set.
              suppressSelectRef.current = false;
            } else if (
              suppressSelectRef.current &&
              eventDetails.reason === "item-press"
            ) {
              // The row was activated by the delete button's synthetic click;
              // keep the menu open instead of selecting the topic.
              suppressSelectRef.current = false;
              eventDetails.cancel();
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
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
            className="w-(--anchor-width) min-w-56 rounded-lg"
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
                onClick={() => {
                  if (suppressSelectRef.current) {
                    suppressSelectRef.current = false;
                    return;
                  }
                  setActiveTopicId(topic.id);
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
        onCreated={(topicId) => setActiveTopicId(topicId as Id<"book_topics">)}
      />
      <DeleteTopicDialog
        topic={topicToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTopicToDelete(null);
          }
        }}
      />
    </SidebarMenu>
  );
}
