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

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_BUCKET = process.env.S3_BUCKET;

if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
  throw new Error(
    "Missing S3 configuration. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY and S3_BUCKET.",
  );
}

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  // The browser supplies the upload body after the URL has been signed.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function buildStatementKey({
  userId,
  documentType,
  filename,
}: {
  userId: string;
  documentType: string;
  filename: string;
}): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `statements/${userId}/${documentType}/${randomUUID()}-${safeFilename}`;
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 300,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getPresignedDownloadUrl({
  key,
  expiresIn = 900,
}: {
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteStatementObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}

export async function getStatementObject(
  key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  const response = await s3Client.send(command);
  const body = await response.Body?.transformToByteArray();
  if (!body || body.byteLength === 0) {
    throw new Error("Statement file is empty or could not be read");
  }
  return {
    buffer: Buffer.from(body),
    contentType: response.ContentType ?? "application/pdf",
  };
}

export async function statementObjectExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

export { MAX_FILE_SIZE, S3_BUCKET };
