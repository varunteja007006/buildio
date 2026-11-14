"use client";

/**
 * Content section — document-style content components.
 *
 * All demos render statically with no external services. The Logo demo
 * reuses /web-app-manifest-192x192.png, which exists in apps/web/public,
 * as the brand image (including for the LogoBrandDownload context menu).
 */

import {
  Logo,
  LogoBrandDownload,
  LogoImage,
  LogoText,
} from "@workspace/ui/components/logo";
import { Markdown } from "@workspace/ui/components/markdown";
import { MoreAppsFooter } from "@workspace/ui/components/more-apps";
import { OpenInNewTabBtn } from "@workspace/ui/components/open-in-new-tab";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { CodeBlockDemo } from "@/components/showcase/code-block-demo";
import { Example, Section } from "@/components/showcase/section";
import { TraceDemo } from "@/components/showcase/trace-demo";

const markdownSample = `## Release notes

Everything in **v2.4** ships with the new \`ContentSection\`.

### Highlights
- Markdown rendering with GFM tables
- Syntax-highlighted code fences with copy buttons
- [Docs](https://buildio.pro) links and inline \`code\` support

> Tip: paste any markdown string to preview it inline.
`;

export function ContentSection() {
  return (
    <Section
      title="Content"
      description="Code blocks, markdown rendering, logo lockups, agent traces, cross-app promo and open-in-new-tab actions."
    >
      <Example
        title="CodeBlock"
        description="Header with title, copy action, numbered lines and a footer; line variants in a compact block."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <CodeBlockDemo />
      </Example>

      <Example
        title="Markdown"
        description="react-markdown with GFM and highlighting, themed prose styles."
        contentClassName="flex-col items-stretch"
      >
        <Markdown>{markdownSample}</Markdown>
      </Example>

      <Example
        title="Trace"
        description="Agent run trace with collapsible steps; fixed-height viewport."
        contentClassName="flex-col items-stretch"
      >
        <TraceDemo />
      </Example>

      <Example
        title="Logo"
        description="Logo lockup plus a context-menu brand download (right-click)."
        contentClassName="items-start"
      >
        <div className="flex flex-wrap items-center gap-6">
          <Logo
            url="#"
            aria-label="buildio home"
            className="rounded-md outline-none hover:opacity-80"
          >
            <LogoImage
              src="/web-app-manifest-192x192.png"
              alt="Buildio logo"
              className="size-8"
            />
            <LogoText>buildio</LogoText>
          </Logo>
          <LogoBrandDownload
            files={[
              {
                name: "buildio-logo-192.png",
                path: "/web-app-manifest-192x192.png",
                format: "png",
              },
            ]}
          >
            <Logo url="#" aria-label="Download buildio brand assets">
              <LogoImage
                src="/web-app-manifest-192x192.png"
                alt=""
                className="size-8"
              />
              <LogoText className="text-base">right-click to save</LogoText>
            </Logo>
          </LogoBrandDownload>
        </div>
      </Example>

      <Example
        title="OpenInNewTabBtn"
        description="Icon button with tooltip opening a file URL in a new tab."
      >
        <TooltipProvider>
          <OpenInNewTabBtn fileUrl="#example" />
        </TooltipProvider>
      </Example>

      <Example
        title="MoreAppsFooter"
        description="Cross-app promo footer driven by the shared BUILDIO_APPS list."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <div className="-mx-5 -mb-5">
          <MoreAppsFooter current="web" />
        </div>
      </Example>
    </Section>
  );
}
