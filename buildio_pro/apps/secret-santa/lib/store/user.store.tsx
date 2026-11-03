"use client";

import { api } from "@workspace/games-convex-backend/convex/_generated/api";
import { useQuery } from "convex/react";
import React from "react";

export type User = ReturnType<typeof useQuery<typeof api.user.getUserByToken>>;

const userStore = React.createContext<{
  userToken: string;
  handleSetUserToken?: (token: string) => void;
  user: User;
}>({
  userToken: "",
  user: undefined,
});

export const UserStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [userToken, setUserToken] = React.useState("");

  const user = useQuery(
    api.user.getUserByToken,
    userToken ? { token: userToken } : "skip",
  );

  if (user?.success === false && user.isFound === false) {
    localStorage.removeItem("userToken");
  }

  const handleSetUserToken = React.useCallback(
    (token: string) => {
      localStorage.setItem("userToken", token);
      setUserToken(token);
    },
    [setUserToken],
  );

  React.useEffect(() => {
    const token = localStorage.getItem("userToken") ?? "";
    if (token) {
      setUserToken(token);
    }
  }, []);

  const valueObj = React.useMemo(() => {
    return {
      userToken,
      handleSetUserToken,
      user,
    };
  }, [userToken, handleSetUserToken, user]);

  return <userStore.Provider value={valueObj}>{children}</userStore.Provider>;
};

export const useUserStore = () => {
  const context = React.useContext(userStore);

  if (!context) {
    throw new Error("User store should be within the provider");
  }

  return context;
};
