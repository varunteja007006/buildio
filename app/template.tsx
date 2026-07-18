import React, { ReactNode } from "react";
import Transition from "@/app/transition";

export default function Template({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <Transition>{children}</Transition>;
}
