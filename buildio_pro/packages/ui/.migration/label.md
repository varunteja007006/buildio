# label

2026-11-15 · rewrite from `radix-ui` `Label.Root` to a plain `<label>` element (no Base UI Label primitive exists) · ✅ migrated, Radix-free

## Changed

- Import: `radix-ui` → none; the wrapper is now a plain `<label>` typed via `React.ComponentProps<"label">`.
- Class string, `data-slot="label"`, and the export surface (`Label`) are byte-identical otherwise.

## Left alone

- All 36 consumer files across apps and `packages/ui` internals (`form.tsx`, `field.tsx`, `data-table-slider-filter.tsx`, `animate-ui/...`) untouched — they all use plain `htmlFor`/`className`/children.

## Behavior changes

- Radix `Label.Root` natively supported `asChild`; a repo-wide scan found zero `<Label asChild>` usage, so nothing is lost. If one appears later, use Base UI's `useRender` (`render={child}`) as in `badge.tsx`.
- Native `<label>` focus/click association (clicking the label focuses `htmlFor`'s control) matches Radix behavior.

## Verify by hand

- Radix sweep on `label.tsx` → no matches.
- Any form with labels (expense-tracker forms, web showcase form-country-demo): labels still visually render and clicking one focuses its input.
