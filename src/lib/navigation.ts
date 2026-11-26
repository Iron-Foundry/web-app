export const NAV_SECTIONS = [
  {
    tab: "foundry",
    label: "Foundry",
    links: [
      { to: "/", label: "Home", exact: true as const },
      { to: "/about", label: "About" },
      { to: "/rules", label: "Rules" },
      { to: "/staff", label: "Our Team" },
    ],
  },
  {
    tab: "community",
    label: "Community",
    links: [
      { to: "/leaderboards", label: "Leaderboards" },
      { to: "/competitions", label: "Competitions" },
      { to: "/parties", label: "Parties" },
      { to: "/calendar", label: "Calendar" },
      { to: "/activities/frenzy", label: "PVM Frenzy" },
      { to: "/activities/tilerace", label: "Tile Race" },
    ],
  },
  {
    tab: "resources",
    label: "Resources",
    links: [
      { to: "/plugins", label: "Plugins" },
      { to: "/resources", label: "Resources & Guides" },
      { to: "/feedback", label: "Feedback Board" },
    ],
  },
] as const;

export const MEMBERS_TAB = { tab: "members", label: "Members", to: "/members" } as const;

export const MEMBERS_SECTION = {
  tab: "members",
  label: "Members",
  links: [
    { to: "/members",              label: "Dashboard",    exact: true as const },
    { to: "/members/profile",      label: "Profile" },
    { to: "/members/tickets",      label: "Tickets" },
    { to: "/members/surveys",      label: "Surveys" },
    { to: "/members/applications", label: "Applications" },
    { to: "/members/suggestions",  label: "Suggestions" },
    { to: "/members/bugs",         label: "Bug Reports" },
    { to: "/members/settings",     label: "Settings" },
  ],
} as const;

export const STAFF_SECTION = {
  tab: "staff",
  label: "Staff",
  links: [
    { to: "/staff-portal",             label: "Overview",        exact: true as const },
    { to: "/staff-portal/members",     label: "Members" },
    { to: "/staff-portal/all-tickets", label: "All Tickets" },
    { to: "/staff-portal/surveys",     label: "Surveys" },
    { to: "/staff-portal/resources",   label: "Staff Resources" },
  ],
} as const;

type NavSection = (typeof NAV_SECTIONS)[number];
export type RowSection = NavSection | typeof STAFF_SECTION | typeof MEMBERS_SECTION;

/** The section whose pages the page row under the top bar lists, or null. */
export function rowSectionFor(tab: string | null): RowSection | null {
  if (tab === "staff") return STAFF_SECTION;
  if (tab === "members") return MEMBERS_SECTION;
  return NAV_SECTIONS.find((s) => s.tab === tab) ?? null;
}

export function getSectionForPath(pathname: string): string | null {
  if (pathname.startsWith("/members")) return "members";
  if (pathname.startsWith("/staff-portal")) return "staff";
  for (const section of NAV_SECTIONS) {
    for (const link of section.links) {
      const exact = "exact" in link && link.exact;
      const matches = exact
        ? pathname === link.to
        : pathname === link.to || pathname.startsWith(link.to + "/");
      if (matches) return section.tab;
    }
  }
  return null;
}
