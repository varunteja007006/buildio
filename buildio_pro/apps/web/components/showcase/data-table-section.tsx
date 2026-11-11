"use client";


import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import * as React from "react";


import { DataTableDemo } from "@/components/showcase/data-table-demo";
import { Example, Section } from "@/components/showcase/section";

/**
 * useDataTable reads the URL state through nuqs (useQueryState), which bails
 * out to client-side rendering — the demo must sit inside a Suspense boundary.
 */
export function DataTableSection() {
  return (
    <Section
      title="Data · Table"
      description="Static table plus the full data-table with URL-backed pagination, sorting, filtering and selection."
    >
      <Example
        title="DataTable"
        description="useDataTable + tanstack table: sortable headers, toolbar filters (title text, status/assignee faceted), row selection and pagination."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <React.Suspense
          fallback={
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <NuqsAdapter>
            <DataTableDemo />
          </NuqsAdapter>
        </React.Suspense>
      </Example>

      <Example
        title="Table"
        description="Static table markup without tanstack state."
        className="md:col-span-2"
        contentClassName="flex-col items-stretch"
      >
        <StaticTableDemo />
      </Example>
    </Section>
  );
}

const people = [
  { name: "Ada Lovelace", role: "Owner", tokens: "24,180" },
  { name: "Grace Hopper", role: "Maintainer", tokens: "18,045" },
  { name: "Alan Turing", role: "Member", tokens: "9,772" },
];

function StaticTableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Tokens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.name}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell>{person.role}</TableCell>
            <TableCell className="text-right tabular-nums">
              {person.tokens}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
