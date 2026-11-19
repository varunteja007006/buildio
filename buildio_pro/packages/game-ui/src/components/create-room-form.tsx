"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useRoomConfig } from "../lib/room-config";
import { useUserStore } from "../lib/store/user.store";
import { createRoomSchema } from "../lib/validators";

type CreateRoomSchema = z.infer<typeof createRoomSchema>;

export function CreateRoomForm({
  onSuccess,
}: Readonly<{
  onSuccess?: () => void;
}>) {
  const { basePath } = useRoomConfig();
  const { userToken } = useUserStore();
  const router = useRouter();

  const createRoomMutation = useMutation(api.rooms.createRoom);

  const form = useForm<CreateRoomSchema>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomName: "",
    },
  });

  const onSubmit = async (data: CreateRoomSchema) => {
    if (!userToken) {
      toast.error("Please register first.");
      return;
    }

    try {
      const result = await createRoomMutation({
        roomName: data.roomName,
        userToken,
      });

      if (result.success) {
        toast.success(result.message);
        form.reset();
        onSuccess?.();
        router.push(`/${basePath}/${result.roomCode}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create room. Please try again.");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-sm lg:w-md space-y-2"
      >
        <FormField
          control={form.control}
          name="roomName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary font-bold">{`Room Name`}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter room name"
                  className="flex-1"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !userToken}
          className="w-full cursor-pointer"
        >
          Create Room
        </Button>
      </form>
    </Form>
  );
}
