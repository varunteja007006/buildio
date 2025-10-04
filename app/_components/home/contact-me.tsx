import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Card } from "@workspace/ui/components/card";

import contactData from "@/app/_components/home/data/contact";

export default function ContactMe() {
  return (
    <section id="contact-me" className="space-y-4">
      <h3 className="text-xl font-semibold">Contact Me</h3>

      <Card className="p-2">
        <Table>
          <TableBody>
            {contactData.map((item) => {
              return (
                <TableRow key={item.id} className="border-none">
                  <TableCell className="font-semibold capitalize">
                    {item.contact_type}
                  </TableCell>
                  <TableCell className="font-semibold">
                    <a href={item.contact_href}>{item.contact_value}</a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
