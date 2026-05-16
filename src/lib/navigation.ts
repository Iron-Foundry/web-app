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

export type NavSection = (typeof NAV_SECTIONS)[number];

export function getSectionForPath(pathname: string): string | null {
  if (pathname.startsWith("/members")) return "members";
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
