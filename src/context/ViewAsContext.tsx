import { createContext, useContext, useMemo, useState } from "react";

export type ViewAsOption = string; // "self" | "member" | role-id

interface ViewAsEntry {
  value: ViewAsOption;
  label: string;
  roles: string[];
}

interface ViewAsContextValue {
  viewAs: ViewAsOption;
  setViewAs: (option: ViewAsOption) => void;
  /** The resolved option entry for the current viewAs selection. */
  currentOption: ViewAsEntry | undefined;
  /** Non-null when viewing as a role other than self. */
  overrideRoles: string[] | null;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: "self",
  setViewAs: () => {},
  currentOption: undefined,
  overrideRoles: null,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAs] = useState<ViewAsOption>("self");

  const currentOption = useMemo<ViewAsEntry | undefined>(() => {
    if (viewAs === "self") return { value: "self", label: "Myself", roles: [] };
    if (viewAs === "member") return { value: "member", label: "Member (no perms)", roles: [] };
    return undefined; // role-ID options are resolved dynamically via useViewAsOptions
  }, [viewAs]);

  const overrideRoles: string[] | null =
    viewAs === "self"
      ? null
      : viewAs === "member"
        ? []
        : [viewAs]; // treat the selected role ID as the override

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, currentOption, overrideRoles }}>
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
