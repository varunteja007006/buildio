"use client";

/**
 * Extras section — components that did not fit the other groups.
 *
 * The form.tsx family and CountryCombobox are RHF-wired and demoed via
 * form-country-demo.tsx (apps/web depends on react-hook-form).
 */

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@workspace/ui/components/attachment";
import { Button } from "@workspace/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxOption,
} from "@workspace/ui/components/combobox";
import { ConfettiSideCannonsBtn } from "@workspace/ui/components/confetti/side-cannons";
import { CircularProgress } from "@workspace/ui/components/progress-08";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileWarningIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { BubbleDemo, MessageDemo } from "@/components/showcase/chat-demo";
import { ComboboxChipsDemo } from "@/components/showcase/combobox-chips-demo";
import {
  FacetedMultipleDemo,
  FacetedSingleDemo,
} from "@/components/showcase/faceted-demo";
import {
  FormCountryComboboxDemo,
  FormFamilyDemo,
} from "@/components/showcase/form-country-demo";
import { MessageScrollerDemo } from "@/components/showcase/message-scroller-demo";
import { Example, Section } from "@/components/showcase/section";
import { SortableDemo } from "@/components/showcase/sortable-demo";

const libraryOptions: ComboboxOption[] = [
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "eslint", label: "ESLint" },
  { value: "prettier", label: "Prettier" },
  { value: "vitest", label: "Vitest" },
];

export function ExtrasSection() {
  const [library, setLibrary] = React.useState<ComboboxOption | null>(
    libraryOptions[0] ?? null,
  );

  return (
    <Section
      title="Extras"
      description="Attachment chips, chat bubbles, messages, sortable lists, chip comboboxes, form fields, progress and confetti."
    >
      <Example
        title="Attachment"
        description="Static chips: file, failed upload and a dashed add trigger. The second group is width-constrained to show the horizontal scroll and snap behavior."
        contentClassName="flex-col items-stretch"
      >
        <AttachmentGroup className="flex-wrap">
          <Attachment size="sm">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Download">
                <DownloadIcon />
              </AttachmentAction>
              <AttachmentAction aria-label="Remove">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <Attachment state="error" size="sm">
            <AttachmentMedia>
              <FileWarningIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>heavy-video.mov</AttachmentTitle>
              <AttachmentDescription>Upload failed — too large</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Attachment state="idle" size="sm">
            <AttachmentTrigger
              onClick={() => undefined}
              aria-label="Add attachment"
            />
            <AttachmentMedia>
              <PlusIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>Add attachment</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        </AttachmentGroup>
        <AttachmentGroup className="max-w-xs [scrollbar-width:thin]!">
          <Attachment size="sm">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>annual-review-final-v2.mov</AttachmentTitle>
              <AttachmentDescription>Video · 184 MB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Attachment size="sm">
            <AttachmentMedia>
              <FileSpreadsheetIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>design-tokens-backup.json</AttachmentTitle>
              <AttachmentDescription>JSON · 96 KB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </AttachmentGroup>
      </Example>

      <Example title="Bubble" contentClassName="flex-col items-stretch">
        <BubbleDemo />
      </Example>

      <Example
        title="Message & MessageScroller"
        description="Message list inside an auto-scrolling viewport with a scroll-to-end button."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <MessageScrollerDemo />
      </Example>

      <Example
        title="Sortable"
        description="Drag the handles to reorder; dnd-kit handles the rest."
        contentClassName="flex-col items-stretch"
      >
        <SortableDemo />
      </Example>

      <Example
        title="Message"
        description="Message group with avatars, header and seen footer."
        contentClassName="flex-col items-stretch"
      >
        <MessageDemo />
      </Example>

      <Example
        title="ComboboxChips"
        description="Multi-select chips with remove buttons over the Base-UI combobox."
        contentClassName="flex-col items-stretch"
      >
        <ComboboxChipsDemo />
      </Example>

      <Example
        title="ComboboxInput"
        description="Input group with inline trigger and clear affordances."
        contentClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-64">
          <Combobox
            items={libraryOptions}
            itemToStringLabel={(option) => option.label}
            value={library}
            onValueChange={(option) => setLibrary(option ?? null)}
          >
            <ComboboxTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                />
              }
            >
              <span className="truncate">
                {library?.label ?? "Pick a tool…"}
              </span>
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxInput placeholder="Search…" showClear />
              <ComboboxEmpty>Nothing found</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboboxOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </Example>

      <Example
        title="Faceted"
        description="Single-select popover over a Command list; picking an option closes it."
        contentClassName="flex-col items-stretch"
      >
        <FacetedSingleDemo />
      </Example>

      <Example
        title="Faceted · Multiple"
        description="Multi-select with FacetedBadgeList rendering the chosen options as badges."
        contentClassName="flex-col items-stretch"
      >
        <FacetedMultipleDemo />
      </Example>

      <Example
        title="Form"
        description="RHF primitives (FormProvider, FormField, FormItem, FormControl, FormDescription, FormMessage) around a small two-field form."
        contentClassName="flex-col items-stretch"
      >
        <FormFamilyDemo />
      </Example>

      <Example
        title="CountryCombobox"
        description="Searchable country picker with flag emoji, wired to react-hook-form."
        contentClassName="flex-col items-stretch"
      >
        <FormCountryComboboxDemo />
      </Example>

      <Example
        title="CircularProgress"
        description="Static SVG progress rings (progress-08)."
      >
        <CircularProgress value={62} size={80} showLabel />
        <CircularProgress value={87} size={80} showLabel />
      </Example>

      <Example
        title="Confetti · Side cannons"
        description="canvas-confetti driven side cannon button."
      >
        <ConfettiSideCannonsBtn
          size="sm"
          onClickCb={() => toast.success("Side cannons fired!")}
        >
          Celebrate
        </ConfettiSideCannonsBtn>
      </Example>
    </Section>
  );
}
