import * as React from "react";

import { Card, CardTitle } from "@workspace/ui/components/card";
import industrySkillsData from "@/app/_components/home/data/industry-skills";
import technicalSkillsData from "@/app/_components/home/data/technical-skills";

export default function Skills() {
  const technicalSkillTypes = React.useMemo(() => {
    return Object.keys(technicalSkillsData) as Array<
      keyof typeof technicalSkillsData
    >;
  }, []);

  return (
    <section id="skills" className="space-y-20">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Technical Skills</h3>

        {technicalSkillTypes.map((item) => {
          return (
            <React.Fragment key={item}>
              <p className="font-semibold">{technicalSkillsData[item].label}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {technicalSkillsData[item].skillList.map((innerItem) => {
                  if (!innerItem.toShow) {
                    return null;
                  }
                  return (
                    <Card key={`${item} ${innerItem.name}`}>
                      <div className="flex items-center gap-5 px-5">
                        <innerItem.icon className="size-12" />
                        <CardTitle className="text-base">{innerItem.name}</CardTitle>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Industry Skills</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {industrySkillsData.map((item) => {
            if (!item.toShow) {
              return null;
            }
            return (
              <Card key={item.id}>
                <div className="flex items-center gap-5 px-6">
                  <item.icon className="size-12" />
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
