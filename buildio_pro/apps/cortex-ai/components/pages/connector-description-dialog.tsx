"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { getConnectorDescriptionMetadata } from "@/api/connections/api";
import type { ConnectorMetadata } from "@/api/connections/types";
import { ConnectorDescriptionActivity } from "@/components/pages/connector-description-activity";
import { ConnectorDescriptionSelection } from "@/components/pages/connector-description-selection";
import { useConnectorDescriptionGeneration } from "@/components/pages/use-connector-description-generation";

type Props = {
  connectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (description: string) => void;
};

export function ConnectorDescriptionDialog({
  connectionId,
  open,
  onOpenChange,
  onGenerated,
}: Props) {
  const [metadata, setMetadata] = useState<ConnectorMetadata | null>(null);
  const [savedExplanationCount, setSavedExplanationCount] = useState(0);
  const [metadataTables, setMetadataTables] = useState<Set<string>>(new Set());
  const [sampleColumns, setSampleColumns] = useState<Record<string, string[]>>(
    {},
  );
  const [includeSamples, setIncludeSamples] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const generation = useConnectorDescriptionGeneration({
    connectionId,
    metadata,
    metadataTables,
    includeSamples,
    sampleColumns,
    clearSampleConsent: () => {
      setIncludeSamples(false);
      setSampleColumns({});
    },
    onGenerated,
  });
  const resetGeneration = generation.reset;
  const setGenerationError = generation.setError;

  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    setMetadata(null);
    setMetadataTables(new Set());
    setSampleColumns({});
    setIncludeSamples(false);
    setConsentVersion((version) => version + 1);
    setLoadingMetadata(true);
    resetGeneration();
    getConnectorDescriptionMetadata(connectionId, abort.signal)
      .then((result) => {
        setMetadata(result.metadata);
        setSavedExplanationCount(result.savedExplanationCount ?? 0);
        setMetadataTables(
          new Set(
            result.metadata.tables.map(({ schema, name }) => `${schema}\0${name}`),
          ),
        );
      })
      .catch((reason: unknown) => {
        if (!abort.signal.aborted)
          setGenerationError(
            reason instanceof Error
              ? reason.message
              : "Unable to inspect schema",
          );
      })
      .finally(() => setLoadingMetadata(false));
    return () => abort.abort();
  }, [connectionId, resetGeneration, setGenerationError, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && generation.generating) generation.abort();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle>Generate connector explanation</DialogTitle>
          <DialogDescription>
            Review exactly what AI may inspect before confirming.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1 pr-4">
          {loadingMetadata ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : null}
          {generation.error ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {generation.error}
            </p>
          ) : null}
          {metadata ? (
            <>
              {savedExplanationCount > 0 && (
                <p className="mb-3 rounded-md border p-2 text-sm">
                  {savedExplanationCount} saved table{" "}
                  {savedExplanationCount === 1 ? "explanation" : "explanations"}{" "}
                  will be shared with the model as additional context.
                </p>
              )}
              <ConnectorDescriptionSelection
                metadata={metadata}
                metadataTables={metadataTables}
                setMetadataTables={setMetadataTables}
                includeSamples={includeSamples}
                setIncludeSamples={setIncludeSamples}
                sampleColumns={sampleColumns}
                setSampleColumns={setSampleColumns}
                disabled={generation.generating}
                consentVersion={consentVersion}
              />
            </>
          ) : null}
          <ConnectorDescriptionActivity
            activities={generation.activities}
            summary={generation.summary}
          />
          {generation.generatedDraft ? (
            <section className="mb-4 rounded-md border p-3">
              <h3 className="text-sm font-medium">Generated draft</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {generation.generatedDraft}
              </p>
              <Button
                className="mt-3"
                type="button"
                onClick={() => {
                  onGenerated(generation.generatedDraft);
                  onOpenChange(false);
                }}
              >
                Use this draft
              </Button>
            </section>
          ) : null}
        </ScrollArea>
        <DialogFooter className="shrink-0 border-t pt-4">
          {generation.generating ? (
            <Button type="button" variant="outline" onClick={generation.abort}>
              Cancel generation
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={
              !metadata ||
              loadingMetadata ||
              generation.generating ||
              metadataTables.size === 0
            }
            onClick={() => void generation.generate()}
          >
            {generation.generating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            {generation.generating ? "Generating…" : "Confirm and generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
