"use client";


import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { ConfettiButton } from "@workspace/ui/components/confetti";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  CircleAlertIcon,
  InfoIcon,
  InboxIcon,
  RocketIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Example, Section } from "@/components/showcase/section";

export function FeedbackSection() {
  return (
    <Section
      title="Feedback"
      description="Alerts, progress, spinners, toasts (sonner), confetti and empty states."
    >
      <Example title="Alert" description="default and destructive variants." contentClassName="flex-col items-stretch">
        <Alert>
          <RocketIcon />
          <AlertTitle>Deploy finished</AlertTitle>
          <AlertDescription>
            Your preview deployment is live and linked to the PR.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Build failed</AlertTitle>
          <AlertDescription>Type error in chart-demo.tsx:42.</AlertDescription>
        </Alert>
      </Example>

      <Example title="Progress" contentClassName="flex-col items-stretch gap-4">
        <Progress value={32} />
        <Progress value={70} />
        <Progress value={100} />
      </Example>

      <Example title="Spinner" description="Inline loading indicator.">
        <Spinner />
        <Spinner className="size-6" />
        <span className="flex items-center gap-2 text-sm">
          <Spinner /> Loading…
        </span>
      </Example>

      <Example title="Toasts (sonner)" description="Toaster is mounted once at the showcase root.">
        <Button onClick={() => toast.success("Changes saved!")}>Success</Button>
        <Button variant="outline" onClick={() => toast.info("Heads up…")}>
          Info
        </Button>
        <Button variant="outline" onClick={() => toast.warning("Deprecated API")}>
          Warning
        </Button>
        <Button
          variant="destructive"
          onClick={() => toast.error("Something broke")}
        >
          Error
        </Button>
        <Button variant="secondary" onClick={() => toast.promise(new Promise((r) => setTimeout(r, 1200)), { loading: "Deploying…", success: "Deployed!", error: "Failed" })}>
          Promise
        </Button>
      </Example>

      <Example title="Confetti" description="ConfettiButton fires from the button position.">
        <ConfettiButton options={{ particleCount: 120, spread: 70 }}>
          🎉 Celebrate
        </ConfettiButton>
      </Example>

      <Example title="Empty" description="Dashed placeholder with media, title, actions." className="md:col-span-2" contentClassName="items-stretch">
        <Empty className="border rounded-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No invites yet</EmptyTitle>
            <EmptyDescription>
              Share your workspace link and invites will show up here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Button size="sm">Invite people</Button>
              <Button size="sm" variant="outline">
                <InfoIcon />
                Learn more
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </Example>
      <Example title="Separator" description="Divider line, optional inset label.">
        <div className="flex items-center gap-3 text-sm">
          <span>Start</span>
          <Separator className="flex-1" />
          <span>End</span>
        </div>
      </Example>
    </Section>
  );
}
