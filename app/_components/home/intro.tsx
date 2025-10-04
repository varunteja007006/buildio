import React from "react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { CloudDownload } from "lucide-react"

import Image from "next/image"
import ContactIcons from "./contact-icons"

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

          <div className="space-y-4 text-center text-base leading-loose lg:w-2/3">
            <div>
              {`Hi 👋, I’m Varun, a Senior Software Engineer at Renault Nissan
            Technology and Business Center India (RNTBCI). I build full-stack
            applications that bring AI-powered insights to supplier risk
            assessment, procurement, and sustainability—helping businesses cut
            through paperwork and make better, data-driven decisions. `}
            </div>

            <div>
              {`My core stack is Next.js, React, and Tailwind CSS on the frontend,
              and NestJS, Postgres, and Java on the backend. I also have
              hands-on experience with Node.js, Express, MongoDB, and MSSQL,
              giving me a strong foundation in both SQL and NoSQL systems. I’m
              passionate about scalable architecture, clean code, and continuous
              learning.`}
            </div>
            <div>
              {`Currently, I’m sharpening my skills in Java, MCP servers, and vibe
              coding, while planning to explore Go, Rust, and C to get closer to
              the low-level systems that fascinate me.`}
            </div>
            <div className="font-semibold">- Varun Teja</div>
            <div>
              <ContactIcons className="" />
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
