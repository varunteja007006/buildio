"use client";

/**
 * Registry extras section — standalone registry components:
 * ColorPicker.tsx, SimpleColorPicker.tsx, SearchableCombobox.tsx,
 * SimpleSearchableCombobox.tsx and UploadedFiles.tsx.
 *
 * Notes:
 * - ColorPicker / SimpleColorPicker / SearchableCombobox take a
 *   react-hook-form `control`; apps/web depends on react-hook-form, so they
 *   are demoed inside a real `Form` (FormProvider) driven by `useForm`.
 * - UploadedFilesCard takes `{ key, url, name }` file records; the demo uses
 *   inline SVG data URIs so no upload backend or network access is required.
 */

import ColorPicker from "@workspace/ui/components/ColorPicker";
import type { ComboboxOption } from "@workspace/ui/components/combobox";
import { Form } from "@workspace/ui/components/form";
import SearchableCombobox from "@workspace/ui/components/SearchableCombobox";
import SimpleColorPicker from "@workspace/ui/components/SimpleColorPicker";
import SimpleSearchableCombobox from "@workspace/ui/components/SimpleSearchableCombobox";
import { UploadedFilesCard } from "@workspace/ui/components/UploadedFiles";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Example, Section } from "@/components/showcase/section";

type ColorFormValues = {
  color: string;
  simpleColor: string;
};

type FrameworkFormValues = {
  framework: string;
};

const frameworkOptions: ComboboxOption[] = [
  { value: "next", label: "Next.js" },
  { value: "expo", label: "Expo" },
  { value: "vite", label: "Vite" },
  { value: "astro", label: "Astro" },
];

/** Inline SVG data URI so the demo needs no network or public assets. */
function svgPreview(label: string, from: string, to: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="320" y="190" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.9)" text-anchor="middle">${label}</text></svg>`,
  )}`;
}

const mockUploadedFiles = [
  {
    key: "mock-1",
    url: svgPreview("Aurora hero", "#0ea5e9", "#6366f1"),
    name: "aurora-hero.png",
    contentType: "image/svg+xml",
    size: 184_320,
  },
  {
    key: "mock-2",
    url: svgPreview("Sunset banner", "#f97316", "#e11d48"),
    name: "sunset-banner.png",
    contentType: "image/svg+xml",
    size: 96_570,
  },
  {
    key: "mock-3",
    url: svgPreview("Meadow shot", "#22c55e", "#0d9488"),
    name: "meadow-shot.png",
    contentType: "image/svg+xml",
    size: 121_400,
  },
];

export function RegistryExtrasSection() {
  const colorForm = useForm<ColorFormValues>({
    defaultValues: { color: "#008000", simpleColor: "#ff0000" },
  });
  const frameworkForm = useForm<FrameworkFormValues>({
    defaultValues: { framework: "next" },
  });
  const [simpleFramework, setSimpleFramework] = React.useState(
    frameworkOptions[0]?.value ?? "",
  );

  return (
    <Section
      title="Registry extras"
      description="Standalone registry components: color pickers, searchable comboboxes and an uploaded-files card."
    >
      <Example
        title="ColorPicker"
        description="@uiw/react-color Compact palette inside a popover, wired to a react-hook-form field; includes a clear button once a value is set."
        contentClassName="flex-col items-stretch"
      >
        <Form {...colorForm}>
          <form className="max-w-sm">
            <ColorPicker
              control={colorForm.control}
              name="color"
              label="Vehicle color"
              description="Pick from common vehicle colors."
              onSelectionChange={(color) =>
                toast.success(`Advanced picker: ${color}`)
              }
            />
          </form>
        </Form>
      </Example>

      <Example
        title="SimpleColorPicker"
        description="Native color input variant of ColorPicker (variant=&quot;simple&quot;)."
        contentClassName="flex-col items-stretch"
      >
        <Form {...colorForm}>
          <form className="max-w-sm">
            <SimpleColorPicker
              control={colorForm.control}
              name="simpleColor"
              label="Accent color"
              description="Same form field bag, native input."
              onSelectionChange={(color) =>
                toast.success(`Simple picker: ${color}`)
              }
            />
          </form>
        </Form>
      </Example>

      <Example
        title="SearchableCombobox"
        description="Form-integrated searchable combobox over ComboboxSelect."
        contentClassName="flex-col items-stretch"
      >
        <Form {...frameworkForm}>
          <form className="max-w-sm">
            <SearchableCombobox
              control={frameworkForm.control}
              name="framework"
              label="Framework"
              options={frameworkOptions}
              description="Type to filter the options."
              onSelectionChange={(value) =>
                toast.success(`Framework: ${value}`)
              }
            />
          </form>
        </Form>
      </Example>

      <Example
        title="SimpleSearchableCombobox"
        description="Standalone wrapper around ComboboxSelect with clearable and toggle-deselect behavior."
        contentClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <SimpleSearchableCombobox
            options={frameworkOptions}
            value={simpleFramework}
            onSelect={setSimpleFramework}
            placeholder="Select a framework"
            searchPlaceholder="Search frameworks…"
          />
        </div>
      </Example>

      <Example
        title="UploadedFilesCard"
        description="Scrollable gallery of uploaded file previews. Mock records with inline SVG data URIs — no upload backend needed."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <UploadedFilesCard uploadedFiles={mockUploadedFiles} />
      </Example>
    </Section>
  );
}
