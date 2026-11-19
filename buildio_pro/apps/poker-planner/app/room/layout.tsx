import { RoomGate } from "@workspace/game-ui/components/room-gate";
import type { ReactNode } from "react";


export default function RoomLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RoomGate askRole>{children}</RoomGate>;
}
