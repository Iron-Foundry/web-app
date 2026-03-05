export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Rules", to: "/rules" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];