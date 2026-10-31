# Billezy

## Money and repayments

- Trip total includes active expenses only, never repayments.
- A person's share is the sum of their exact, cent-rounded expense allocations.
- Remaining balance = expenses paid − share + repayments sent − repayments received.
- Remainder cents go to the first participants in the stored selection order.
- Transfers use greedy matching; they settle all balances but are not guaranteed to minimize the number of transfers.
- Anyone with the group link can edit expenses, record repayments, and undo payment records. These are manual records, not verified bank transactions.
- Deleted expenses stay in trash until restored or explicitly deleted permanently. Existing repayments remain when expenses change.

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

Production: run `pnpm exec convex deploy` inside `packages/games-convex-backend`, then deploy Billezy via its existing Netlify pipeline. Verify the frontend's `NEXT_PUBLIC_CONVEX_URL` points to that production deployment. Do not use the development deployment for the live site.
