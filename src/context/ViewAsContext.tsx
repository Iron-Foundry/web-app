import { createContext, useContext, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewAsOption = "self" | "member" | "mentor" | "event-team" | "moderator";

export const VIEW_AS_OPTIONS: { value: ViewAsOption; label: string; roles: string[] }[] = [
  { value: "self",        label: "Myself",                roles: [] }, // placeholder
  { value: "member",      label: "Member (no perms)",     roles: [] },
  { value: "mentor",      label: "Mentor",                roles: ["Mentor"] },
  { value: "event-team",  label: "Event Team",            roles: ["Event Team"] },
  { value: "moderator",   label: "Moderator",             roles: ["Moderator"] },
];

interface ViewAsContextValue {
  viewAs: ViewAsOption;
  setViewAs: (option: ViewAsOption) => void;
  /** Non-null when viewing as a role other than self. */
  overrideRoles: string[] | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: "self",
  setViewAs: () => {},
  overrideRoles: null,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAs] = useState<ViewAsOption>("self");
  const overrideRoles =
    viewAs === "self"
      ? null
      : (VIEW_AS_OPTIONS.find((o) => o.value === viewAs)?.roles ?? null);

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, overrideRoles }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsContextValue {
  return useContext(ViewAsContext);
}

/**
 * Returns the roles to use for all permission checks.
 * Senior staff viewing as another role get the override; everyone else gets their real roles.
 */
export function useEffectiveRoles(actualRoles: string[]): string[] {
  const { overrideRoles } = useViewAs();
  return overrideRoles ?? actualRoles;
}
