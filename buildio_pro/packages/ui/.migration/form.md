# form

2026-11-15 · in-place dependency swap from `radix-ui` (`Slot`, `Label` type) to `@base-ui/react/use-render` + local `Label` typing · ✅ migrated, Radix-free

react-hook-form wiring (`FormField`/`Controller`, `useFormField`, `FormItemContext` ids, `FormMessage`) is untouched — this is an import-surface-preserving migration, **not** a port to `@base-ui/react/field` (whose controlled `invalid`/`touched`/`dirty` Root props target a different integration model; no repo component uses Base UI Field yet).

## Changed

- Removed `import { Slot } from "radix-ui"` and `import type { Label as LabelPrimitive } from "radix-ui"`.
- `FormControl`: was `<Slot.Root data-slot="form-control" id aria-describedby aria-invalid {...props}>{child}</Slot.Root>`; now `useRender({ render: child, props: { "data-slot": "form-control", id, "aria-describedby", "aria-invalid", ...props } })` from `@base-ui/react/use-render` — the established repo pattern (badge, breadcrumb, button-group, item, bubble, …). Props merge via Base UI's `mergeProps` (className concatenation etc.), matching Radix Slot semantics; `children` is destructured out so the slotted element is never re-spread onto itself.
- `FormControl` props type: `React.ComponentProps<typeof Slot.Root>` → `React.ComponentProps<"div">` (children must be a single valid React element; invalid/non-element children render `null` where Radix Slot also rendered nothing).
- `FormLabel` props type: `React.ComponentProps<typeof LabelPrimitive.Root>` → `React.ComponentProps<typeof Label>` (the local label component).

## Left alone

- `Form`, `FormField`, `FormItem`, `FormDescription`, `FormMessage`, `useFormField`, both contexts: byte-identical.
- All 7 consumer files (`SearchableCombobox.tsx`, `ColorPicker.tsx`, `country-combobox.tsx` in `packages/ui`, plus `poker-planner` user-registration/create-room forms and 3 web showcase files) untouched. Note: `packages/ui/src/components/forms/` is a separate TanStack Form system, unrelated.

## Behavior changes

- `useRender` clones the child element with merged props — same element identity semantics as Radix Slot for the common `<FormControl><Input …/></FormControl>` shape. React 19 passes `ref` as a regular prop, so ref forwarding through the clone works the same way.

## Verify by hand

- Radix sweep on `form.tsx` → no matches.
- poker-planner user-registration / create-room forms and web showcase form demos: labels link to inputs (`htmlFor`/`id`), error state sets `aria-invalid` + red `FormMessage`, description id wiring intact.
- `SearchableCombobox`/`ColorPicker`/`country-combobox` inside RHF forms still register values correctly.
