"use client";

/**
 * Form fields section — the packages/ui `forms/` family.
 *
 * These components are TanStack Form based (`useAppForm` + `form.AppField`),
 * so every demo card below is a small standalone working form. `FormBase`
 * is the shared shell each field renders through and is demoed directly.
 */

import {
  FormCurrencyInputDemo,
  FormCurrencySelectDemo,
  FormDatePickerDemo,
  FormYearPickerDemo,
} from "@/components/showcase/form-fields-pickers-demo";
import {
  FormBaseDemo,
  FormCheckboxDemo,
  FormInputDemo,
  FormSelectDemo,
  FormTextareaDemo,
} from "@/components/showcase/form-fields-text-demo";
import { Example, Section } from "@/components/showcase/section";

export function FormFieldsSection() {
  return (
    <Section
      title="Form fields"
      description="TanStack Form field wrappers from forms/: a shared FormBase shell with input, textarea, checkbox, select, currency, date and year pickers — each card is a live form."
    >
      <Example
        title="FormBase"
        description="The label/description/error shell behind every Form* field, here wrapped around a raw Input."
        contentClassName="flex-col items-stretch"
      >
        <FormBaseDemo />
      </Example>

      <Example
        title="FormInput"
        description="Text input with cheap required validation rendered by the shell."
        contentClassName="flex-col items-stretch"
      >
        <FormInputDemo />
      </Example>

      <Example
        title="FormTextarea"
        description="Textarea field bound to a string form value."
        contentClassName="flex-col items-stretch"
      >
        <FormTextareaDemo />
      </Example>

      <Example
        title="FormCheckbox"
        description="Boolean field; FormBase puts the control first in a horizontal layout."
        contentClassName="flex-col items-stretch"
      >
        <FormCheckboxDemo />
      </Example>

      <Example
        title="FormSelect"
        description="Select field — items are passed as children."
        contentClassName="flex-col items-stretch"
      >
        <FormSelectDemo />
      </Example>

      <Example
        title="FormCurrencyInput"
        description="Currency picker (display-side, not form-bound) beside a numeric input bound to the form."
        contentClassName="flex-col items-stretch"
      >
        <FormCurrencyInputDemo />
      </Example>

      <Example
        title="FormCurrencySelect"
        description="Searchable currency picker fully bound to the form (stores the ISO code)."
        contentClassName="flex-col items-stretch"
      >
        <FormCurrencySelectDemo />
      </Example>

      <Example
        title="FormDatePicker"
        description="Calendar popover bound to a Date form value."
        contentClassName="flex-col items-stretch"
      >
        <FormDatePickerDemo />
      </Example>

      <Example
        title="FormYearPicker"
        description="Searchable year list; bounded range via minYear/maxYear."
        contentClassName="flex-col items-stretch"
      >
        <FormYearPickerDemo />
      </Example>
    </Section>
  );
}
