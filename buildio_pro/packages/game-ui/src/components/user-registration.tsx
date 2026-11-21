"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
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
import { cn } from "@workspace/ui/lib/utils";
import { useMutation } from "convex/react";
import { SendHorizontal } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useRoomConfig } from "../lib/room-config";
import { useUserStore } from "../lib/store/user.store";
import { createUserSchema } from "../lib/validators";
import { RoleField } from "./role-field";

type CreateUserSchema = z.infer<typeof createUserSchema>;

export function UserRegistration({
  onSuccess,
  className,
  animated = false,
  delayMs = 0,
  askRole = false,
  joinOnRegister = true,
}: Readonly<{
  onSuccess?: () => void;
  className?: string;
  /** Staggered rise-in animation, used on the home page. */
  animated?: boolean;
  /** Base delay (ms) before the form's stagger sequence starts. */
  delayMs?: number;
  /** Ask for the participant role (poker planner only). */
  askRole?: boolean;
  /** Let an app handle room entry after creating the guest session. */
  joinOnRegister?: boolean;
}>) {
  const rise = (delay: number, className?: string) =>
    animated
      ? {
          className: ["animate-rise", className].filter(Boolean).join(" "),
          style: { animationDelay: `${delayMs + delay}ms` },
        }
      : className
        ? { className }
        : {};
  const { basePath } = useRoomConfig();
  const { handleSetUserToken, userToken } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const registrationRedirect = React.useRef(false);

  const roomCode = params?.roomCode;

  const redirectFromHome = () => {
    if (pathname === "/") {
      router.push(`/${basePath}`);
    }
  };

  const createUserMutation = useMutation(api.user.createUser);

  const form = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateUserSchema) => {
    try {
      const res = await createUserMutation({
        name: data.name,
        ...(joinOnRegister && typeof roomCode === "string" ? { roomCode } : {}),
        ...(data.role ? { role: data.role } : {}),
      });
      if (res.token) {
        registrationRedirect.current = true;
        handleSetUserToken?.(res.token);
      }
      toast.success("User registered successfully!");
      form.reset();
      onSuccess?.();
      redirectFromHome();
    } catch (error) {
      toast.error("Failed to register user. Please try again.");
      console.error(error);
    }
  };

  React.useEffect(() => {
    if (!userToken || pathname !== "/" || registrationRedirect.current) return;

    const timeout = window.setTimeout(() => router.push(`/${basePath}`), 800);
    return () => window.clearTimeout(timeout);
  }, [userToken, pathname, router, basePath]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={
          className ??
          "w-[calc(var(--container-sm)+2rem)] lg:w-[calc(var(--container-md)+2rem)]"
        }
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel {...rise(100, "text-primary")}>Username</FormLabel>
              <FormControl>
                <div
                  {...rise(
                    200,
                    cn(
                      "flex items-center gap-2 rounded-xl border p-1.5 shadow-xs transition-[color,box-shadow]",
                      "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
                      form.formState.errors.name
                        ? "border-destructive ring-[3px] ring-destructive/20"
                        : "border-input",
                    ),
                  )}
                >
                  <Input
                    placeholder="Eg: John Doe"
                    className="h-10 flex-1 border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
                    {...field}
                  />
                  <Button
                    type="submit"
                    aria-label="Continue as guest"
                    size={"icon"}
                    disabled={form.formState.isSubmitting}
                    className="size-10 shrink-0 cursor-pointer rounded-lg"
                  >
                    <SendHorizontal />
                  </Button>
                </div>
              </FormControl>
              <FormDescription {...rise(300, "text-left")}>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {askRole && <RoleField control={form.control} {...rise(350, "")} />}
      </form>
    </Form>
  );
}
