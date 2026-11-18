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
import { useMutation } from "convex/react";
import { SendHorizontal } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useUserStore } from "@/lib/store/user.store";
import { createUserSchema } from "@/lib/validators";

type CreateUserSchema = z.infer<typeof createUserSchema>;

export function UserRegistration({
  onSuccess,
  className,
}: Readonly<{
  onSuccess?: () => void;
  className?: string;
}>) {
  const { handleSetUserToken, userToken } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const roomCode = params?.roomCode;

  const redirectFromHome = () => {
    if (pathname === "/") {
      router.push("/room");
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
        roomCode: roomCode as string,
      });
      if (res.token) {
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
    if (userToken && pathname === "/") {
      router.push("/room");
    }
  }, [userToken, pathname, router]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={className ?? "w-sm lg:w-md"}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary">Username</FormLabel>
              <FormControl>
                <div className="flex gap-4 items-center">
                  <Input
                    placeholder="Eg: John Doe"
                    className="flex-1"
                    {...field}
                  />
                  <Button
                    type="submit"
                    size={"icon"}
                    disabled={form.formState.isSubmitting}
                    className="cursor-pointer"
                  >
                    <SendHorizontal />
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
