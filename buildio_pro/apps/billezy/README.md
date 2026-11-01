# Billezy

## Money and repayments

- Trip total includes active expenses only, never repayments.
- A person's share is the sum of their exact, cent-rounded expense allocations.
- Remaining balance = expenses paid − share + repayments sent − repayments received.
- Remainder cents go to the first participants in the stored selection order.
- Transfers use greedy matching; they settle all balances but are not guaranteed to minimize the number of transfers.
- Anyone with the group link can edit expenses, record repayments, and undo payment records. These are manual records, not verified bank transactions.
- Deleted expenses stay in trash until restored, explicitly deleted permanently, or the group expires. Existing repayments remain when expenses change.

## Recent bills, retention, and offline copies

- The homepage lists up to 50 recent bills, newest first, in this browser's localStorage. It stores the group id and name only — no visit dates and no expiry dates — not bill backups, and does not sync between devices or survive clearing browser storage. Removing a history entry does not delete its group. Bills still expire server-side six months after creation via the retention cron described below. History is not a backup.
- Groups expire **six calendar months after creation**, regardless of later visits or edits. Dates use UTC, with month-end dates clamped to the destination month's last day. A daily Convex cron removes expired groups and all their members, expenses (including trash), and repayment records (including undone records), in bounded batches.
- Each group shows its deletion date and a **Download HTML** button. The standalone file opens offline and can be printed to PDF using the browser. It contains members, all expenses and repayment records with their statuses, a financial summary of active records (total spent, per-member paid/share/repayments, who still owes or receives what, and remaining settlement transfers), and a complete JSON snapshot with original IDs and exact integer cents. Permanently deleted records cannot be exported. Keep the file private: it contains the group's full data.
- **Destructive rollout:** once the updated backend is deployed, existing groups older than six months become eligible for permanent deletion. Save any old bills you need before enabling the cron. History in localStorage is not a backup.

## Checks

From `buildio_pro/`:

```sh
pnpm --filter billezy test # Node.js 22.18+ (native TypeScript support)
pnpm --filter billezy typecheck
pnpm --filter billezy lint
pnpm build:billezy
```

The money checks include the example trip and 1,000 deterministic randomized trips.

To also run the backend integration check, set `BILLEZY_TEST_CONVEX_URL` to a **development** deployment with these functions deployed. It creates and deletes only its own disposable test groups:

```sh
BILLEZY_TEST_CONVEX_URL=https://your-dev-deployment.convex.cloud pnpm --filter billezy test
```

## Deployment

Deploy `packages/games-convex-backend` to the frontend's Convex deployment **before** deploying the updated frontend. The new payment table and deleted-expense index are additive; existing expenses do not need a data migration. `convex codegen` generates bindings but does not publish the application schema/functions.

Production: run `pnpm exec convex deploy` inside `packages/games-convex-backend`, then deploy Billezy via its existing Netlify pipeline. Verify the frontend's `NEXT_PUBLIC_CONVEX_URL` points to that production deployment. Do not use the development deployment for the live site. The cron is registered by the backend deployment; no OS cron or external service is required.
