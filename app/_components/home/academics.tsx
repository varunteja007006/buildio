import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CircularProgress } from "@workspace/ui/components/progress-08";

import academicData from "@/app/_components/home/data/academic";

export default function Academics() {
  return (
    <section id="academics" className="space-y-4">
      <h3 className="text-xl font-semibold">Academics</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {academicData.map((item) => {
          if (!item.toShow) {
            return null;
          }
          return (
            <div
              key={item.id}
              className="flex h-full flex-col gap-2 justify-between bg-card p-5 shadow border rounded-lg"
            >
              <div className="flex flex-row items-start justify-between w-full">
                <div className="space-y-2">
                  <div className="text-base font-semibold">{item.course}</div>
                  <div className="flex-1 text-sm">
                    {item.institute} - {item.year}
                  </div>
                </div>
                <div>
                  <CircularProgress
                    value={item.progress}
                    size={100}
                    strokeWidth={10}
                    showLabel
                    labelClassName="text-xl font-bold"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
