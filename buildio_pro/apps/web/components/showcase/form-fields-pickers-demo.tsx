"use client";

/**
 * Picker/currency field demos for the showcase's FormFields section.
 *
 * Same TanStack Form pattern as form-fields-text-demo.tsx (`useAppForm` +
 * `form.AppField`). `FormYearPicker` is not registered as a field component
 * on `useAppForm` (see packages/ui forms/hooks.tsx), so it is rendered as a
 * standalone component inside an `AppField`, using the shared field context.
 */

import { Button } from "@workspace/ui/components/button";
import { FormYearPicker } from "@workspace/ui/components/forms/FormYearPicker";
import { useAppForm } from "@workspace/ui/components/forms/hooks";
import { toast } from "sonner";

export function FormCurrencyInputDemo() {
  const form = useAppForm({
    defaultValues: { amount: "199.99" },
    onSubmit: () => toast.success("Amount saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="amount">
        {(field) => (
          <field.CurrencyInput
            defaultCurrency="USD"
            description="Static currency picker beside the number input."
            inputPlaceholder="0.00"
            label="Amount"
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}

export function FormCurrencySelectDemo() {
  const form = useAppForm({
    defaultValues: { currency: "EUR" },
    onSubmit: () => toast.success("Currency saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="currency">
        {(field) => (
          <field.CurrencySelect
            description="Fully form-bound — the field stores the ISO code."
            label="Currency"
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}

export function FormDatePickerDemo() {
  const form = useAppForm({
    defaultValues: { dueDate: new Date(2026, 0, 15) },
    onSubmit: () => toast.success("Due date saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="dueDate">
        {(field) => (
          <field.DatePicker
            description="Calendar popover bound to a Date value."
            label="Due date"
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}

export function FormYearPickerDemo() {
  const form = useAppForm({
    defaultValues: { releaseYear: 2026 },
    onSubmit: () => toast.success("Year saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="releaseYear">
        {() => (
          <FormYearPicker
            description="Standalone inside AppField — not a registered field component."
            label="Release year"
            maxYear={2030}
            minYear={2020}
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}
