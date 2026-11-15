"use client";

import { api } from "@workspace/book-convex-backend/convex/_generated/api";
import type { Id } from "@workspace/book-convex-backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ACTIVE_TOPIC_STORAGE_KEY = "book:active-topic";

type ActiveTopicContextValue = {
  /** Resolved id of the active topic; null until topics load / resolve. */
  topicId: Id<"book_topics"> | null;
  /** Active topic summary; null until topics load / resolve. */
  topic: { id: Id<"book_topics">; name: string } | null;
  /** Selects (and persists) the active topic. */
  setActiveTopicId: (topicId: Id<"book_topics">) => void;
};

const ActiveTopicContext = createContext<ActiveTopicContextValue | null>(null);

/**
 * Owns the active-topic state for the whole `/home` tree: persists the
 * selection in localStorage, restores it on load, auto-selects the default
 * topic, and auto-creates the default topic when missing. Mount above
 * `SidebarProvider` so the sidebar and page content share one topic.
 */
export function TopicProvider({ children }: { children: React.ReactNode }) {
  const topics = useQuery(api.bookTopics.list);
  const ensureDefault = useMutation(api.bookTopics.ensureDefault);

  // Selected topic persists in localStorage; missing/stale ids fall back to null.
  const [storedTopicId, setStoredTopicId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_TOPIC_STORAGE_KEY);
  });

  const setActiveTopicId = useCallback((topicId: Id<"book_topics">) => {
    setStoredTopicId(topicId);
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
  // selection that still resolves. A deleted active topic (id no longer in
  // the list) falls back the same way.
  useEffect(() => {
    if (!topicsLoaded) {
      return;
    }
    if (storedTopicId && topics?.some((topic) => topic.id === storedTopicId)) {
      return;
    }
    const fallback = topics?.find((topic) => topic.isDefault) ?? topics?.[0];
    if (fallback) {
      setActiveTopicId(fallback.id);
    }
  }, [topicsLoaded, topics, storedTopicId, setActiveTopicId]);

  const activeTopic = topics?.find((topic) => topic.id === storedTopicId);

  const value = useMemo<ActiveTopicContextValue>(
    () => ({
      topicId: activeTopic ? activeTopic.id : null,
      topic: activeTopic
        ? { id: activeTopic.id, name: activeTopic.name }
        : null,
      setActiveTopicId,
    }),
    [activeTopic, setActiveTopicId],
  );

  return (
    <ActiveTopicContext.Provider value={value}>
      {children}
    </ActiveTopicContext.Provider>
  );
}

/** Access the active topic state provided by {@link TopicProvider}. */
export function useActiveTopic(): ActiveTopicContextValue {
  const context = useContext(ActiveTopicContext);
  if (context === null) {
    throw new Error("useActiveTopic must be used within a TopicProvider");
  }
  return context;
}
