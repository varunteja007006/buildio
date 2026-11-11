"use client";


import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { toast } from "sonner";

export function TabsDemo() {
  return (
    <div className="flex flex-col items-stretch gap-4">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="advanced" disabled>
            Advanced
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="rounded-md border p-4 text-sm">
          Account settings content.
        </TabsContent>
        <TabsContent value="workspace" className="rounded-md border p-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge>Pro</Badge> Workspace settings content.
          </div>
          <Separator className="my-3" />
          <Button size="sm" variant="outline" onClick={() => toast.info("Workspace saved")}>
            Save
          </Button>
        </TabsContent>
        <TabsContent value="advanced" className="rounded-md border p-4 text-sm">
          Disabled tab content.
        </TabsContent>
      </Tabs>
    </div>
  );
}
