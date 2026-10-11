"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createOrGetEmptyThread,
  deleteChatThread,
  getChatModels,
  getChatPreferences,
  getChatThread,
  getChatThreads,
  renameChatThread,
  restoreChatThread,
  updateChatPreferences,
} from "./api";
import type { RenameChatThreadInput } from "./types";

/** Query key factory for chat domain */
export const chatKeys = {
  all: ["chat"] as const,
  threads: () => ["chat", "threads"] as const,
  threadList: () => ["chat", "threads", "list"] as const,
  deletedThreadList: () => ["chat", "threads", "list", "deleted"] as const,
  thread: (id: string) => ["chat", "threads", id] as const,
  models: () => ["chat", "models"] as const,
  preferences: () => ["chat", "preferences"] as const,
};

const PAGE_SIZE = 20;

/** Fetch chat threads with infinite pagination (20 per page) */
export function useChatThreads(pageSize = PAGE_SIZE, deleted = false) {
  return useInfiniteQuery({
    queryKey: deleted
      ? chatKeys.deletedThreadList()
      : chatKeys.threadList(),
    queryFn: ({ pageParam }) => getChatThreads(pageParam, pageSize, deleted),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}

/**
 * Get-or-create an empty chat thread for "New Chat".
 * Navigate to the returned thread's id.
 */
export function useCreateOrGetEmptyThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrGetEmptyThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}

/** Fetch a single thread with its messages */
export function useChatThread(id: string) {
  return useQuery({
    queryKey: chatKeys.thread(id),
    queryFn: () => getChatThread(id),
    enabled: !!id,
    // A missing/deleted thread 404s; don't retry, surface it immediately.
    retry: false,
  });
}

/** Rename a thread */
export function useRenameChatThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RenameChatThreadInput }) =>
      renameChatThread(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}

/** Soft-delete a thread */
export function useDeleteChatThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatThread,
    onSuccess: () => {
      // Covers both the thread list and the thread detail query.
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

/** Restore a soft-deleted thread */
export function useRestoreChatThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreChatThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}

/** Fetch the chat model catalog */
export function useChatModels(enabled = true) {
  return useQuery({
    queryKey: chatKeys.models(),
    queryFn: getChatModels,
    enabled,
  });
}

/** Fetch the user's default chat model */
export function useChatPreferences() {
  return useQuery({
    queryKey: chatKeys.preferences(),
    queryFn: getChatPreferences,
  });
}

/** Update the user's default chat model */
export function useUpdateChatPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(chatKeys.preferences(), data);
    },
  });
}
