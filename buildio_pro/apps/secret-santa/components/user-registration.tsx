"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { SendHorizontal } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/lib/store/user.store";

// type CreateUserSchema = z.infer<typeof createUserSchema>;

export function UserRegistration({
  onSuccess,
}: Readonly<{
  onSuccess?: () => void;
}>) {
  const { handleSetUserToken } = useUserStore();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUserMutation = useMutation(api.user.createUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createUserMutation({
        name: name,
      });
      if (res.token) {
        handleSetUserToken?.(res.token);
      }
      toast.success("User registered successfully!");
      setName("");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to register user. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col items-start space-y-4"
    >
      <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary">
        Username
      </label>
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Eg: John Doe"
          className="flex-1 w-full md:min-w-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          size={"icon"}
          disabled={isSubmitting || !name.trim()}
          className="cursor-pointer"
        >
          <SendHorizontal />
        </Button>
      </div>
      <p className="text-[0.8rem] text-muted-foreground">
        This is your public display name.
      </p>
    </form>
  );
}
