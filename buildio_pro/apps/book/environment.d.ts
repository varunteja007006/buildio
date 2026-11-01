declare namespace NodeJS {
  interface ProcessEnv {
    // Convex
    NEXT_PUBLIC_CONVEX_URL: string;
    NEXT_PUBLIC_CONVEX_SITE_URL: string;
    NEXT_PUBLIC_SITE_URL: string;

    // Next.js
    NODE_ENV: "development" | "production" | "test";
  }
}
