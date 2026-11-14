"use client";

/**
 * RHF-wired demos for the Extras section:
 * - FormFamilyDemo: the form.tsx primitives (Form/FormField/FormItem/…)
 *   around a small two-field react-hook-form form.
 * - FormCountryComboboxDemo: CountryCombobox, hard-wired to react-hook-form
 *   (`control`/`name`), in its own tiny form.
 */

import { Button } from "@workspace/ui/components/button";
import CountryCombobox from "@workspace/ui/components/country-combobox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ProfileFormValues = {
  displayName: string;
  email: string;
};

type CountryFormValues = {
  country: string;
};

export function FormFamilyDemo() {
  const form = useForm<ProfileFormValues>({
    defaultValues: { displayName: "", email: "" },
  });

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={form.handleSubmit((values) =>
          toast.success(`Saved profile for ${values.displayName}`),
        )}
      >
        <FormField
          control={form.control}
          name="displayName"
          rules={{ required: "Display name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Ada Lovelace" {...field} />
              </FormControl>
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="ada@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="self-start" size="sm" type="submit" variant="outline">
          Save profile
        </Button>
      </form>
    </Form>
  );
}

export function FormCountryComboboxDemo() {
  const form = useForm<CountryFormValues>({
    defaultValues: { country: "" },
  });

  return (
    <Form {...form}>
      <form
        className="w-full max-w-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        <CountryCombobox
          control={form.control}
          description="Searchable, flag-emoji picker hard-wired to react-hook-form."
          label="Country"
          name="country"
          onSelectionChange={(country) => {
            if (country) {
              toast.success(`Country: ${country.name}`);
            }
          }}
          required
        />
      </form>
    </Form>
  );
}
