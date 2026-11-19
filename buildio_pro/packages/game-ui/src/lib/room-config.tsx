"use client";

import * as React from "react";

/**
 * Room games live under a per-app route prefix: poker-planner uses
 * "/room/...", scribble and secret-santa use "/rooms/...". Shared room
 * components read the prefix from this context instead of hardcoding it.
 */
const RoomConfigContext = React.createContext<{ basePath: string }>({
  basePath: "rooms",
});

export function RoomConfigProvider({
  children,
  basePath = "rooms",
}: Readonly<{
  children: React.ReactNode;
  basePath?: string;
}>) {
  const value = React.useMemo(() => ({ basePath }), [basePath]);

  return (
    <RoomConfigContext.Provider value={value}>
      {children}
    </RoomConfigContext.Provider>
  );
}

export function useRoomConfig() {
  return React.useContext(RoomConfigContext);
}
