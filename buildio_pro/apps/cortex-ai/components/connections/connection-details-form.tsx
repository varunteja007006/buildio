"use client";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { AlertCircle, CheckCircle2, Loader2, PlugZap } from "lucide-react";

import type { ProbeResult } from "@/api/connections/types";

export type DetailsFormState = {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
};

/** Client-side mirrors of the server zod limits in lib/connectors/validation.ts. */
const MAX_FIELD_LENGTHS: Record<keyof DetailsFormState, number | undefined> = {
  name: 128,
  host: 255,
  port: undefined,
  database: 128,
  username: 128,
  password: 256,
};

export const emptyDetailsForm: DetailsFormState = {
  name: "",
  host: "",
  port: "5432",
  database: "",
  username: "",
  password: "",
};

type ConnectionDetailsFormProps = {
  form: DetailsFormState;
  editing: boolean;
  error: string | null;
  testing: boolean;
  probe: ProbeResult | null;
  onChange: (field: keyof DetailsFormState, value: string) => void;
  onTest: () => void;
};

const fields = [
  { key: "name", label: "Connection name", type: "text", id: "conn-name" },
  { key: "host", label: "Host", type: "text", id: "conn-host" },
  { key: "port", label: "Port", type: "number", id: "conn-port" },
  { key: "database", label: "Database", type: "text", id: "conn-database" },
  { key: "username", label: "Username", type: "text", id: "conn-username" },
] as const;

export function ConnectionDetailsForm({
  form,
  editing,
  error,
  testing,
  probe,
  onChange,
  onTest,
}: ConnectionDetailsFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="grid gap-2">
          <Label htmlFor={field.id}>{field.label}</Label>
          <Input
            id={field.id}
            type={field.type}
            value={form[field.key]}
            maxLength={MAX_FIELD_LENGTHS[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </div>
      ))}
      <div className="grid gap-2">
        <Label htmlFor="conn-password">Password</Label>
        <Input
          id="conn-password"
          type="password"
          autoComplete="new-password"
          placeholder={editing ? "Leave blank to keep current" : ""}
          value={form.password}
          maxLength={MAX_FIELD_LENGTHS.password}
          onChange={(event) => onChange("password", event.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onTest} disabled={testing}>
          {testing ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <PlugZap data-icon="inline-start" />
          )}
          Check connection
        </Button>
        {probe?.ok && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Connected in {probe.latencyMs ?? 0}ms
          </span>
        )}
      </div>
      {probe && !probe.ok && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{probe.error ?? "Connection failed"}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}