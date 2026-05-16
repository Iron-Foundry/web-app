export const NAV_SECTIONS = [
  {
    tab: "explore",
    label: "Explore",
    links: [
      { to: "/", label: "Home", exact: true as const },
      { to: "/about", label: "About" },
      { to: "/rules", label: "Rules" },
      { to: "/staff", label: "Our Team" },
    ],
  },
  {
    tab: "activities",
    label: "Activities",
    links: [
      { to: "/competitions", label: "Competitions" },
      { to: "/parties", label: "Parties" },
      { to: "/calendar", label: "Calendar" },
      { to: "/bingo", label: "Bingo" },
    ],
  },
  {
    tab: "resources",
    label: "Resources",
    links: [
      { to: "/leaderboards", label: "Leaderboards" },
      { to: "/plugins", label: "Plugins" },
      { to: "/resources", label: "Resources & Guides" },
    ],
  },
] as const;

export const MEMBERS_TAB = { tab: "members", label: "Members", to: "/members" } as const;

export const STAFF_SECTION = {
  tab: "staff",
  label: "Staff",
  links: [
    { to: "/staff-portal",             label: "Overview",        exact: true as const },
    { to: "/staff-portal/members",     label: "Members" },
    { to: "/staff-portal/all-tickets", label: "All Tickets" },
    { to: "/staff-portal/surveys",     label: "Surveys" },
    { to: "/staff-portal/badges",      label: "Badges" },
    { to: "/staff-portal/assets",      label: "Asset Library" },
    { to: "/staff-portal/resources",   label: "Staff Resources" },
    { to: "/staff-portal/ranking",     label: "Ranking" },
  ],
} as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

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
