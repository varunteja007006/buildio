import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
};

/** Returns the authenticated user's document, throwing when unauthenticated. */
export const getCurrentUser = query({
  args: {},
  // The Better Auth user table lives inside the component (non-local
  // install), so its document shape is dynamic from this backend's view.
  returns: v.any(),
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
