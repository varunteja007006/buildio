import React from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { CloudDownload, Quote } from "lucide-react";

import Image from "next/image";
import ContactIcons from "./contact-icons";
import {
  SiJavascript,
  SiNextdotjs,
  SiPostgresql,
  SiTailwindcss,
} from "react-icons/si";
import { FaNodeJs, FaReact } from "react-icons/fa";

const expertise = [
  { name: "JavaScript", icon: SiJavascript },
  { name: "Next JS", icon: SiNextdotjs },
  { name: "React JS", icon: FaReact },
  { name: "Node JS", icon: FaNodeJs },
  { name: "PostgreSQL", icon: SiPostgresql },
  { name: "Tailwind CSS", icon: SiTailwindcss },
];

export default function Intro() {
  return (
    <section id="intro">
      <Card className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4">
        <div className="flex flex-col items-start gap-10 px-6 lg:flex-row">
          <div className="flex w-full flex-col items-center gap-5 lg:w-1/3">
            <Image
              alt="profile"
              src={"/profile.webp"}
              width={400}
              height={400}
              className="h-auto w-full rounded-lg"
              unoptimized={true}
              priority={true}
            />
            <div>
              <Button
                variant={"outline"}
                className="text-base font-bold"
                asChild
              >
                <a download href="/resume_varun.pdf">
                  <CloudDownload /> Download Resume
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-4 text-center max-w-prose text-base leading-loose">
            <div>{`Hi 👋, I'm Varun,`}</div>
            <div className="max-w-prose">
              {`I work at Renault Nissan
            Technology and Business Center India as a Senior Software Engineer. I build full-stack
            applications that bring privacy driven AI-powered insights to assess supplier risk
            , procurement, and sustainability — helping business with quick analysis
             and better, data-driven decisions. `}
            </div>

            <div className="flex flex-row gap-4 items-center flex-wrap justify-center">
              {expertise.map((item) => {
                return (
                  <div
                    key={item.name}
                    className="flex shadow-xs flex-row gap-2 items-center border border-primary/10 hover:border-primary/50 hover:bg-primary/10 cursor-pointer px-2 py-1 rounded-lg"
                  >
                    <item.icon />
                    {item.name}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-row justify-center">
              <blockquote className="relative p-2 font-semibold pl-8 bg-accent/30 border-l-4 border-accent text-accent-foreground font-mono italic rounded-md max-w-prose">
                <Quote className="absolute top-3 left-2 size-4 opacity-70" />I
                believe in scalable architecture, clean code, and continuous
                learning.
              </blockquote>
            </div>

            <div>
              <ContactIcons />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
