"use client";


import DebouncedInput from "@workspace/ui/components/debounced-input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@workspace/ui/components/input-otp";
import { NativeSelect } from "@workspace/ui/components/native-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Example, Section } from "@/components/showcase/section";

export function FormsControlsSection() {
  return (
    <Section
      title="Forms · Selects & Controls"
      description="Select, native select, OTP, input group and debounced input."
    >
      <Example title="Select">
        <div className="w-full max-w-56">
          <Select defaultValue="framework">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Frameworks</SelectLabel>
                <SelectItem value="next">Next.js</SelectItem>
                <SelectItem value="expo">Expo</SelectItem>
                <SelectItem value="svelte" disabled>SvelteKit</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </Example>

      <Example title="NativeSelect" description="A styled native <select>.">
        <div className="w-full max-w-56">
          <NativeSelect defaultValue="react" aria-label="Favorite library">
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="solid">Solid</option>
          </NativeSelect>
        </div>
      </Example>

      <Example title="InputOTP" description="4-digit code with group slots.">
        <InputOTP maxLength={4} onComplete={() => toast.success("Code entered!")}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </Example>

      <Example title="InputGroup" description="Input with addon, text and buttons." contentClassName="flex-col items-stretch">
        <InputGroup className="w-full">
          <InputGroupInput placeholder="Search the docs…" />
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupText>12 results</InputGroupText>
            <InputGroupButton onClick={() => toast.info("Filter toggled")}>
              <PlusIcon />
              Add
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup className="w-full">
          <InputGroupTextarea placeholder="Leave a comment…" rows={2} />
        </InputGroup>
      </Example>

      <Example title="DebouncedInput" description="700 ms debounce; shows the debounced value.">
        <div className="w-full max-w-56">
          <DebouncedInput
            placeholder="Type to search…"
            onChange={(value: string) =>
              toast.info(`Debounced value: ${value || "empty"}`)
            }
          />
        </div>
      </Example>
    </Section>
  );
}
