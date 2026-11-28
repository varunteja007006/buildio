"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useSpeechCommand } from "@/hooks/use-speech-command";
import { parseTaskCommand } from "@/lib/task-command";

export function TaskCommandForm() {
  const router = useRouter();
  const { listen, cancel, isListening, speechMessage } = useSpeechCommand();
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");

  function runCommand(text: string) {
    const result = parseTaskCommand(text);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setError("");
    router.push(result.href);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancel();
    runCommand(command);
  }

  function speak() {
    setError("");
    listen((transcript) => {
      setCommand(transcript);
      runCommand(transcript);
    });
  }

  return (
    <form className="panel filters command-form" onSubmit={submit}>
      <label>
        Task command
        <input
          aria-describedby="task-command-example"
          value={command}
          onChange={(event) => {
            cancel();
            setError("");
            setCommand(event.target.value);
          }}
        />
      </label>
      <button type="submit">Run command</button>
      <button type="button" onClick={speak} disabled={isListening}>
        Speak command
      </button>
      <div className="command-help">
        <p id="task-command-example" className="muted">
          Try “Show completed tasks for Product launch”
        </p>
        <p role="status">{speechMessage || error}</p>
      </div>
    </form>
  );
}
