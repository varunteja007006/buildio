# bubble

2026-11-14 — Slot → `useRender` migration. Verdict: clean, single occurrence (`BubbleContent` only); no app call site uses `asChild` on BubbleContent (checked `apps/cortex-ai/components/chat/chat-message.tsx` — plain children only).

## Changed

- `packages/ui/src/components/bubble.tsx`
  - Import: `import { Slot } from "radix-ui"` → `import { useRender } from "@base-ui/react/use-render"`.
  - `BubbleContent`: `const Comp = asChild ? Slot.Root : "div"` → `useRender({ render: isChildRender ? children : <div data-slot="bubble-content" />, props: {...} })`.
  - `children` now destructured so it can be conditionally excluded from `props` when `asChild` + valid element child (avoids clobbering the render element's children).
  - `asChild` kept as deprecated Radix-compat prop with the standard `/** @deprecated Radix compat — Base UI uses `render`. */` marker (button.tsx convention).
- All classNames, cva variants, data-slot attributes, and exports byte-identical. `BubbleGroup`/`Bubble`/`BubbleReactions` untouched (no Slot usage).

## Left alone

- package.json / pnpm-workspace.yaml — no dependency edits; Radix deps remain for other in-flight migrations.
- `apps/cortex-ai/components/chat/chat-message.tsx` — no `asChild` usage; untouched.

## Behavior changes

- None for current call sites (none use `asChild`). Edge case: `asChild` with a non-element child (string) previously rendered via Radix Slot's span fallback; now renders the default `<div data-slot="bubble-content">` with the child inside — closer to the non-asChild path and an improvement, not a regression.

## Verify by hand

- `apps/cortex-ai` chat: messages still render as rounded bubble-content blocks; default/secondary/ghost variants keep their background colors; user-aligned (end) bubbles still self-end via `group-data-[align=end]/bubble:self-end`.
