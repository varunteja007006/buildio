import { z } from "zod";

/** Participant roles for poker planning. Stored globally per user. */
export const ROLES = ["frontend", "backend", "mobile", "qa", "ba"] as const;

export type Role = (typeof ROLES)[number];

/** Chip display labels, keyed by role value. */
export const ROLE_LABELS: Record<Role, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  qa: "QA",
  ba: "BA",
};

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  role: z.optional(z.enum(ROLES)),
});

export const createRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, "Room name is required")
    .max(100, "Room name must be less than 100 characters"),
});
