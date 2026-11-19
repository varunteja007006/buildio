"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import type { Control } from "react-hook-form";
import type { z } from "zod";

import { ROLES, ROLE_LABELS, createUserSchema } from "../lib/validators";

type CreateUserSchema = z.infer<typeof createUserSchema>;

/**
 * Optional single-select role picker (Frontend / Backend / Mobile / QA / BA).
 * Rendered inside the registration form; tapping the active chip clears it.
 */
export function RoleField({
  control,
  className,
}: Readonly<{
  control: Control<CreateUserSchema>;
  className?: string;
}>) {
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>Role</FormLabel>
          <FormControl>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={6}
              className="flex-wrap"
              value={field.value ? [field.value] : []}
              onValueChange={(value) => {
                field.onChange(value[0]);
              }}
            >
              {ROLES.map((role) => (
                <ToggleGroupItem
                  key={role}
                  value={role}
                  className="rounded-full px-3.5"
                >
                  {ROLE_LABELS[role]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FormControl>
          <FormDescription>
            Optional — shown as a badge next to your name on the board.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}