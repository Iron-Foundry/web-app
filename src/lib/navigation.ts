export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Our Team", to: "/staff" },
  { label: "Rules", to: "/rules" },
  { label: "About", to: "/about" },
  { label: "Calendar", to: "/calendar" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];