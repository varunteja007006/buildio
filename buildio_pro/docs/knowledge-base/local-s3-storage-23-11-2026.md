---
model: gpt-6.2-sol
last-updated: 23-11-2026
user: varun
---

# Local S3 storage

Both apps run SeaweedFS in Compose. Its `mini` mode creates the configured S3
bucket at startup and stores data in a per-project `seaweedfs_data` volume.

| App             | `S3_ENDPOINT`           | Default `S3_BUCKET` |
| --------------- | ----------------------- | ------------------- |
| Cortex AI       | `http://localhost:9002` | `cortex-ai`         |
| Expense Tracker | `http://localhost:9000` | `expense-tracker`   |

Set these values and `S3_ACCESS_KEY` and `S3_SECRET_KEY` in the app's `.env`.
Compose and the app read the same keys. The local Compose defaults are
`minioadmin` for both keys. Compose-network S3 clients can use `http://s3:8333`.
For the app, use an endpoint reachable by both the app server and the browser
because presigned URLs use that host. The old MinIO console ports (`9003` and
`9001`) are retired. Use an S3 client to list and inspect objects.

## Start with an empty bucket

If you can discard access to the old objects, skip the copy. Stop the old
MinIO container if it is running (`docker stop cortex_ai_minio` for Cortex AI
or `docker stop expense_tracker_minio` for Expense Tracker). This frees the S3
port and keeps the old volume available.

From `buildio_pro/`, run `docker compose -f apps/cortex-ai/docker-compose.yml up -d --wait s3`.
Substitute `expense-tracker` for the other app. Existing database records that
reference old objects will point to missing files.

## Move existing MinIO objects

The old `minio_data` volume holds MinIO's storage format. Keep it for rollback
and copy objects through S3 so the keys already stored in the app database keep
working. If you set `MINIO_ROOT_USER` or `MINIO_ROOT_PASSWORD` and want to reuse
them, put those values in `S3_ACCESS_KEY` and `S3_SECRET_KEY`, respectively.
Keep the existing `S3_BUCKET` value. Preserve the original MinIO credentials
for the source and any rollback.

1. Pause app writes and leave the old MinIO endpoint running. If needed, use the
   original Compose config with its locally cached image and original volume to
   bring the source back online.
2. Start the new `s3` service in the **same Compose project** as the app with a
   temporary Compose override. Save this as `/tmp/seaweedfs-migration.yml` and
   choose a free port for each migration.

   ```yaml
   services:
     s3:
       ports: !override
         - "127.0.0.1:19000:8333"
   ```

   Set `app` to the app you are migrating. If you normally pass `-p`, use that
   same project name for every Compose command in this procedure.

   ```sh
   app=cortex-ai
   docker compose -f "apps/$app/docker-compose.yml" -f /tmp/seaweedfs-migration.yml up -d --wait s3
   ```

3. Configure two [rclone S3 remotes](https://rclone.org/s3/) using `rclone config`.
   Use `minio` for the original endpoint and `seaweedfs` for
   `http://127.0.0.1:19000`. Set each remote's credentials and use path-style
   requests in `us-east-1`. Copy and compare the current objects using the app's
   bucket name in both paths.

   ```sh
   bucket=cortex-ai # Replace with the app's S3_BUCKET value.
   rclone copy --immutable --metadata "minio:$bucket" "seaweedfs:$bucket"
   rclone check --download "minio:$bucket" "seaweedfs:$bucket"
   ```

4. After the check passes, stop the old MinIO container without deleting it or
   its volume (`docker stop cortex_ai_minio` or
   `docker stop expense_tracker_minio`). Start `s3` again with just the regular
   Compose file to restore the usual S3 port and reuse the new volume. Restart
   the app with the new credentials and verify that an existing file opens
   before resuming writes.

For rollback, pause writes, stop `s3`, and restart the original MinIO container
with the previous app configuration. If SeaweedFS took writes after cutover,
reconcile those writes before switching the app back.
