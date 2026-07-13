import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ViewAsOption = string; // "self" | "member" | "user" | role-id

export interface ViewAsUser {
  id: string;
  label: string;
  roles: string[];
}

interface ViewAsContextValue {
  viewAs: ViewAsOption;
  setViewAs: (option: ViewAsOption) => void;
  /** Switch to mocking a specific member's roles. */
  viewAsUser: (user: ViewAsUser) => void;
  /** The member being mocked, when viewAs is "user". */
  userOverride: ViewAsUser | null;
  /** Non-null when viewing as anything other than self. */
  overrideRoles: string[] | null;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: "self",
  setViewAs: () => {},
  viewAsUser: () => {},
  userOverride: null,
  overrideRoles: null,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAsState] = useState<ViewAsOption>("self");
  const [userOverride, setUserOverride] = useState<ViewAsUser | null>(null);

  const setViewAs = useCallback((option: ViewAsOption) => {
    setUserOverride(null);
    setViewAsState(option);
  }, []);

  const viewAsUser = useCallback((user: ViewAsUser) => {
    setUserOverride(user);
    setViewAsState("user");
  }, []);

  const overrideRoles = useMemo<string[] | null>(() => {
    if (viewAs === "self") return null;
    if (viewAs === "member") return [];
    if (viewAs === "user") return userOverride?.roles ?? [];
    return [viewAs];
  }, [viewAs, userOverride]);

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, viewAsUser, userOverride, overrideRoles }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsContextValue {
  return useContext(ViewAsContext);
}

/**
 * Returns the roles to use for all permission checks.
 * Bypass-role users viewing as another role get the override; everyone else gets their real roles.
 */
export function useEffectiveRoles(actualRoles: string[]): string[] {
  const { overrideRoles } = useViewAs();
  return overrideRoles ?? actualRoles;
}
