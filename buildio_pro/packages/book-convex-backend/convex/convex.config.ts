import betterAuth from "@convex-dev/better-auth/convex.config";
import { v } from "convex/values";
import { defineApp } from "convex/server";

const app = defineApp({
  env: {
    // Base URL of the Next.js app consuming this backend; used as better-auth's
    // `baseURL` (convex/auth.ts). Set on the deployment with
    // `npx convex env set SITE_URL=http://localhost:3017` (dev) or the
    // production app URL.
    SITE_URL: v.optional(v.string()),
  },
});
app.use(betterAuth);
export default app;
