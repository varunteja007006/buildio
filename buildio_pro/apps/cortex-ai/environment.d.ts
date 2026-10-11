declare namespace NodeJS {
  interface ProcessEnv {
    // PostgreSQL
    DATABASE_URL: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;

    // Valkey (Redis-compatible cache)
    VALKEY_URL: string;

    // Vercel AI Gateway
    AI_GATEWAY_API_KEY: string;
    VERCEL_OIDC_TOKEN?: string;

    // AI model configuration — required, no hardcoded fallbacks
    AI_EMBEDDING_MODEL: string;
    /** Must match the embeddings.embedding vector column dimension. */
    AI_EMBEDDING_DIMENSIONS: string;
    CHAT_DEFAULT_MODEL: string;
    DOCUMENT_EXTRACTION_MODEL: string;
    PDF_EXTRACTION_MODEL: string;
    IMAGE_EXTRACTION_MODEL: string;
    EXPOSE_USER_EXTRACTION_MODEL_CHOICE?: string;

    /** Model used to draft extraction templates from a sample document. */
    EXTRACTION_TEMPLATE_SUGGESTION_MODEL: string;

    // Chat guardrail (defaults to enabled; model required while enabled)
    CHAT_GUARDRAIL_ENABLED?: string;
    CHAT_GUARDRAIL_MODEL?: string;

    // Better Auth
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    TRUSTED_ORIGINS?: string;

    // Google OAuth
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;

    // MinIO (S3-compatible object storage, document and connector uploads)
    S3_ENDPOINT?: string;
    S3_ACCESS_KEY?: string;
    S3_SECRET_KEY?: string;
    S3_BUCKET?: string;

    // Connector dev servers (docker-compose defaults apply)
    CONNECTOR_POSTGRES_USER?: string;
    CONNECTOR_POSTGRES_PASSWORD?: string;
    CONNECTOR_POSTGRES_DB?: string;
    MONGO_USER?: string;
    MONGO_PASSWORD?: string;
    MYSQL_USER?: string;
    MYSQL_PASSWORD?: string;
    MYSQL_ROOT_PASSWORD?: string;

    // Connection credential encryption (AES-256-GCM key material)
    ENCRYPTION_KEY: string;

    // Next.js
    NODE_ENV: "development" | "production" | "test";
  }
}
