import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "server-only";

const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET } = process.env;

if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
  throw new Error(
    "Missing MinIO/S3 configuration. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY and S3_BUCKET.",
  );
}

const client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
});

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export function buildDocumentKey(workspaceId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `documents/${workspaceId}/${randomUUID()}-${safeName}`;
}

export function buildChatAttachmentKey(
  workspaceId: string,
  threadId: string,
  filename: string,
) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `chat-attachments/${workspaceId}/${threadId}/${randomUUID()}-${safeName}`;
}

export function getDocumentUploadUrl(key: string, contentType: string) {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
}

export async function getDocumentObject(key: string): Promise<Uint8Array> {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const response = await fetch(key);
    if (!response.ok)
      throw new Error(`Failed to fetch file: HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
  const response = await client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
  );
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes?.byteLength) throw new Error("Document file is empty or missing");
  return bytes;
}

export async function documentObjectExists(key: string, size: number) {
  try {
    const response = await client.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    return response.ContentLength === size;
  } catch {
    return false;
  }
}

export async function deleteDocumentObject(key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export { S3_BUCKET };
