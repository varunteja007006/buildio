"use client";

/**
 * Text-ish field demos for the showcase's FormFields section.
 *
 * The packages/ui `forms/` components are TanStack Form based (`useAppForm`
 * + `form.AppField` render props), NOT react-hook-form — the usage below
 * mirrors apps/expense-tracker form components. `FormBase` is the shell
 * every `Form*` field renders through; FormBaseDemo renders it directly
 * around a raw input.
 */

import { Button } from "@workspace/ui/components/button";
import { FormBase } from "@workspace/ui/components/forms/FormBase";
import { useAppForm } from "@workspace/ui/components/forms/hooks";
import { Input } from "@workspace/ui/components/input";
import { SelectItem } from "@workspace/ui/components/select";
import { toast } from "sonner";

export function FormBaseDemo() {
  const form = useAppForm({
    defaultValues: { nickname: "" },
    onSubmit: () => undefined,
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="nickname">
        {(field) => (
          <FormBase
            label="Nickname"
            description="FormBase wrapped around a raw input — label, description and error slot."
          >
            <Input
              id={field.name}
              name={field.name}
              placeholder="Ada"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormBase>
        )}
      </form.AppField>
    </form>
  );
}

export function FormInputDemo() {
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: () => toast.success("Name submitted"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField
        name="name"
        validators={{
          onBlur: ({ value }) =>
            value.trim() ? undefined : { message: "Name is required" },
        }}
      >
        {(field) => (
          <field.Input
            label="Name"
            description="Required — blur empty or submit to see the error."
            placeholder="Ada Lovelace"
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Submit
      </Button>
    </form>
  );
}

export function FormTextareaDemo() {
  const form = useAppForm({
    defaultValues: { notes: "Ship the showcase first." },
    onSubmit: () => toast.success("Notes saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="notes">
        {(field) => (
          <field.Textarea
            label="Notes"
            description="Textarea field with a static default value."
            placeholder="Add notes…"
          />
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}

export function FormCheckboxDemo() {
  const form = useAppForm({
    defaultValues: { newsletter: true },
    onSubmit: () => undefined,
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="newsletter">
        {(field) => (
          <field.Checkbox
            label="Weekly digest"
            description="Renders through FormBase with controlFirst + horizontal."
          />
        )}
      </form.AppField>
    </form>
  );
}

export function FormSelectDemo() {
  const form = useAppForm({
    defaultValues: { theme: "system" },
    onSubmit: () => toast.success("Theme saved"),
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="theme">
        {(field) => (
          <field.Select
            label="Theme"
            description="Bound to a string form value; items passed as children."
          >
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </field.Select>
        )}
      </form.AppField>
      <Button className="self-start" size="sm" type="submit" variant="outline">
        Save
      </Button>
    </form>
  );
}
