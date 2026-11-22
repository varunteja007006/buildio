"use client";

import { StartStopButton } from "@workspace/ui/components/start-stop-button";
import * as React from "react";

import { Example, Section } from "@/components/showcase/section";

export function StartStopDemo() {
  const [active, setActive] = React.useState(false);

  return (
    <Section
      title="Activity controls"
      description="A stateful start/stop button with optional loading feedback."
    >
      <Example title="StartStopButton">
        <StartStopButton active={active} onClick={() => setActive(!active)} />
        <StartStopButton loading startLabel="Starting" />
      </Example>
    </Section>
  );
}
