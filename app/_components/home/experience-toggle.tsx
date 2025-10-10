"use client";

import React from "react";

import { Button } from "@workspace/ui/components/button";

import { cn } from "@workspace/ui/lib/utils";

import { ExperienceRecord } from "./data/experience";
import { Separator } from "@workspace/ui/components/separator";

const ExperienceToggleContext = React.createContext<{
  data: ExperienceRecord | null;
  handleData: (data: ExperienceRecord) => void;
}>({
  data: null,
  handleData: (x) => {},
});

export const ExperienceToggleProvider = ({
  children,
  defaultData,
}: {
  children: React.ReactNode;
  defaultData: ExperienceRecord | undefined;
}) => {
  const [data, setData] = React.useState<ExperienceRecord | null>(null);

  const handleData = (data: ExperienceRecord) => setData(data);

  React.useEffect(() => {
    if (!defaultData) {
      return;
    }
    handleData(defaultData);
  }, [defaultData]);

  const value = React.useMemo(() => ({ handleData, data }), [setData, data]);

  return (
    <ExperienceToggleContext.Provider value={value}>
      {children}
    </ExperienceToggleContext.Provider>
  );
};

export function ExperienceToggleBtn({
  data,
  children,
  className,
}: Readonly<{
  data: ExperienceRecord;
  children: React.ReactNode;
  className?: string;
}>) {
  const { handleData } = React.useContext(ExperienceToggleContext);

  const handleOnClick = () => {
    handleData(data);
  };

  return (
    <Button onClick={handleOnClick} size={"icon"} className={cn("", className)}>
      {children}
    </Button>
  );
}

export function ExperienceDataRender() {
  const { data } = React.useContext(ExperienceToggleContext);

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h6 className="font-semibold">Role & Impact</h6>
      <Separator />
      <ul className="list-inside list-disc space-y-3 text-black dark:text-white">
        {data.jobDescription.map((item, index) => {
          const key = `${index} - description`;
          return (
            <li key={key} className="text-sm">
              {item}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
