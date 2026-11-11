"use client";


import { Button } from "@workspace/ui/components/button";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { DateTimePicker } from "@workspace/ui/components/date-time-picker";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@workspace/ui/components/file-upload";
import { PhoneInput } from "@workspace/ui/components/phone-input";
import { YearPicker } from "@workspace/ui/components/year-picker";
import { UploadIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Example, Section } from "@/components/showcase/section";

export function FormsPickersSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateTime, setDateTime] = React.useState<Date | undefined>();
  const [year, setYear] = React.useState<number | undefined>(2026);
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <Section
      title="Forms · Date, Time & Files"
      description="Calendar-based pickers, phone input and the file-upload flow."
    >
      <Example title="DatePicker" contentClassName="flex-col items-stretch">
        <DatePicker value={date} onChange={setDate} className="w-full max-w-64" />
      </Example>

      <Example title="DateTimePicker" description="Calendar plus hour/minute selects." contentClassName="flex-col items-stretch">
        <DateTimePicker
          value={dateTime}
          onChange={(value) => {
            setDateTime(value);
            if (value) toast.info(`Picked: ${value.toLocaleString()}`);
          }}
          className="w-full max-w-64"
        />
      </Example>

      <Example title="YearPicker & PhoneInput" contentClassName="flex-col items-stretch">
        <YearPicker
          value={year}
          onChange={setYear}
          minYear={2015}
          maxYear={2030}
          className="w-full max-w-64"
        />
        <div className="max-w-64">
          <PhoneInput
            defaultCountry="IN"
            placeholder="+91 555 000 1234"
            onChange={() => undefined}
          />
        </div>
      </Example>

      <Example
        title="FileUpload"
        description="Dropzone, trigger, list with preview, metadata and delete."
        contentClassName="flex-col items-stretch"
      >
        <FileUpload
          multiple
          maxFiles={3}
          accept="image/*,.pdf"
          onValueChange={setFiles}
          className="w-full"
        >
          <FileUploadDropzone className="border-dashed py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <UploadIcon className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">Drag & drop files here</p>
              <FileUploadTrigger asChild>
                <Button variant="outline" size="sm">
                  Browse files
                </Button>
              </FileUploadTrigger>
              <p className="text-xs text-muted-foreground">
                Up to 3 files · images and PDF
              </p>
            </div>
          </FileUploadDropzone>
          <FileUploadList>
            {files.map((file) => (
              <FileUploadItem key={file.name} value={file} className="gap-3 rounded-md border p-2">
                <FileUploadItemPreview className="size-9" />
                <FileUploadItemMetadata size="sm" />
                <FileUploadItemDelete asChild>
                  <Button variant="ghost" size="icon-xs" aria-label={`Delete ${file.name}`}>
                    ×
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            ))}
          </FileUploadList>
        </FileUpload>
      </Example>
    </Section>
  );
}
