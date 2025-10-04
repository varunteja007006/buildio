import React from "react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

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
            <Card
              key={item.id}
              className="flex h-full flex-col justify-between"
            >
              <CardHeader>
                <CardTitle className="text-lg">{item.course}</CardTitle>
                <CardDescription>
                  {item.institute} - {item.year}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <p className="text-sm font-semibold">{item.score}</p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
