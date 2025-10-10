import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Badge } from "@workspace/ui/components/badge";

import experienceData from "@/app/_components/home/data/experience";
import {
  addYears,
  differenceInMonths,
  differenceInYears,
  format,
  parse,
} from "date-fns";
import { Maximize2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

function calcExp(date1: string, date2: string) {
  const resigningDate = new Date(parse(date1, "yyyy-MM-dd", new Date()));
  const joiningDate = new Date(parse(date2, "yyyy-MM-dd", new Date()));

  // Calculate the difference in years
  let years = differenceInYears(resigningDate, joiningDate);
  // Calculate the remaining months after accounting for the years
  let months = differenceInMonths(resigningDate, addYears(joiningDate, years));

  // Handle the case where months are negative
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years}.${months}`;
}

export default function Experience() {
  return (
    <section id="experience" className="space-y-4">
      <h3 className="text-xl font-semibold">Experience</h3>

      <div>
        {experienceData.map((item, index) => {
          if (!item.toShow) {
            return null;
          }

          return (
            <React.Fragment key={item.id}>
              <Dialog>
                <div className="bg-card shadow rounded-lg border p-4 max-w-sm mb-2">
                  <div>
                    <div className="flex items-center gap-3 text-base font-semibold">
                      {item.jobTitle}{" "}
                      {item.current && (
                        <Badge variant="default" className="font-semibold">
                          Current
                        </Badge>
                      )}
                      {item.current ? (
                        <Badge variant="outline" className="font-semibold">
                          Exp:{" "}
                          {calcExp(
                            format(new Date(), "yyyy-MM-dd"),
                            item.dateOfJoining
                          )}{" "}
                          yrs
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-semibold">
                          Exp:{" "}
                          {calcExp(item.dateOfResigning, item.dateOfJoining)}
                          {"  "}
                          yrs
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <p className="mb-2 text-sm text-gray-600 dark:text-white">
                        {item.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <div className="text-sm">
                      {item.workingFrom}{" "}
                      {item.workingTill && `- ${item.workingTill}`}
                    </div>
                    <div>
                      <DialogTrigger asChild>
                        <Button variant="default" size="icon">
                          <Maximize2 className="size-4" />
                        </Button>
                      </DialogTrigger>
                    </div>
                  </div>
                </div>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{item.jobTitle}</DialogTitle>
                    <DialogDescription>
                      <span className="font-semibold text-sm text-gray-500">
                        {item.company}
                      </span>
                      {item.current && (
                        <Badge variant="default" className="font-semibold ml-2">
                          Current
                        </Badge>
                      )}
                      {item.current ? (
                        <Badge variant="outline" className="font-semibold ml-2">
                          Exp:{" "}
                          {calcExp(
                            format(new Date(), "yyyy-MM-dd"),
                            item.dateOfJoining
                          )}{" "}
                          yrs
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-semibold ml-2">
                          Exp:{" "}
                          {calcExp(item.dateOfResigning, item.dateOfJoining)}
                          {"  "}
                          yrs
                        </Badge>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <ul className="list-inside list-disc space-y-3 text-black dark:text-white">
                      {item.jobDescription.map((item, index) => (
                        <li key={index} className="text-sm">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm">
                    {item.workingFrom}{" "}
                    {item.workingTill && `- ${item.workingTill}`}
                  </div>
                </DialogContent>
              </Dialog>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
