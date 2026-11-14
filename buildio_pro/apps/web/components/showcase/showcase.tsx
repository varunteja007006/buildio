"use client";

import { Toaster } from "@workspace/ui/components/sonner";

import { ContentSection } from "@/components/showcase/content-section";
import { DataSection } from "@/components/showcase/data-section";
import { DataTableSection } from "@/components/showcase/data-table-section";
import { ExtrasSection } from "@/components/showcase/extras-section";
import { FeedbackSection } from "@/components/showcase/feedback-section";
import { FormsComboboxesSection } from "@/components/showcase/forms-comboboxes-section";
import { FormsControlsSection } from "@/components/showcase/forms-controls-section";
import { FormsPickersSection } from "@/components/showcase/forms-pickers-section";
import { FormsSection } from "@/components/showcase/forms-section";
import { NavigationSection } from "@/components/showcase/navigation-section";
import { OverlaysMenusSection } from "@/components/showcase/overlays-menus-section";
import { OverlaysSection } from "@/components/showcase/overlays-section";
import { PrimitivesSection } from "@/components/showcase/primitives-section";

export function Showcase() {
  return (
    <>
      <Toaster position="bottom-right" />
      <PrimitivesSection />
      <FormsSection />
      <FormsControlsSection />
      <FormsComboboxesSection />
      <FormsPickersSection />
      <OverlaysSection />
      <OverlaysMenusSection />
      <DataTableSection />
      <DataSection />
      <FeedbackSection />
      <NavigationSection />
      <ExtrasSection />
      <ContentSection />
    </>
  );
}
