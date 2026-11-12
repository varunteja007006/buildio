"use client";


import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Slider } from "@workspace/ui/components/slider";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import * as React from "react";

import { Example, Section } from "@/components/showcase/section";

export function FormsSection() {
  const [slider, setSlider] = React.useState([40]);
  const [wifi, setWifi] = React.useState(true);

  return (
    <Section
      title="Forms · Inputs"
      description="Uncontrolled, stateful and hook-free form primitives."
    >
      <Example title="Label + Input + Textarea" contentClassName="flex-col items-stretch">
        <div className="grid gap-2">
          <Label htmlFor="demo-name">Name</Label>
          <Input id="demo-name" placeholder="Ada Lovelace" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="demo-email">Email (invalid)</Label>
          <Input id="demo-email" type="email" defaultValue="not-an-email" aria-invalid />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="demo-bio">Bio</Label>
          <Textarea id="demo-bio" placeholder="Tell us about yourself…" rows={3} />
        </div>
      </Example>

      <Example title="Checkbox" description="Default, checked and indeterminate.">
        <div className="flex flex-col gap-2">
          {["Push notifications", "Marketing emails", "Weekly digest"].map((label, index) => (
            <label key={label} className="flex items-center gap-2 text-sm leading-none">
              <Checkbox
                defaultChecked={index < 2}
                indeterminate={index === 2}
              />
              {label}
            </label>
          ))}
        </div>
      </Example>

      <Example title="RadioGroup">
        <RadioGroup defaultValue="comfortable" className="gap-2">
          {[
            { value: "default", label: "Default" },
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm leading-none">
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </Example>

      <Example title="Switch">
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            Wi-Fi
            <Switch checked={wifi} onCheckedChange={setWifi} aria-label="Toggle wi-fi" />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            Airplane mode
            <Switch aria-label="Toggle airplane mode" />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            Disabled
            <Switch disabled aria-label="Toggle disabled" />
          </label>
        </div>
      </Example>

      <Example title="Slider" description={`Value: ${slider[0]}`} contentClassName="flex-col items-stretch">
        <Slider
          value={slider}
          onValueChange={setSlider}
          max={100}
          step={1}
          aria-label="Demo slider"
        />
        <Slider defaultValue={[30, 70]} max={100} aria-label="Range slider" />
      </Example>

      <Example title="Field" description="Layout primitives for building accessible forms.">
        <FieldGroup className="w-full">
          <Field>
            <FieldLegend>Profile</FieldLegend>
            <FieldDescription>Public information about you.</FieldDescription>
          </Field>
          <FieldSeparator />
          <Field>
            <FieldLabel htmlFor="demo-handle">Handle</FieldLabel>
            <Input id="demo-handle" placeholder="@handle" />
            <FieldDescription>Shown on your public profile.</FieldDescription>
          </Field>
        </FieldGroup>
      </Example>
    </Section>
  );
}
