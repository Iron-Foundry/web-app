import type { ComponentType } from "react";
import {
  ArrowRightLeft,
  Lock,
  Bot,
  BarChart2,
  Cog,
  Trophy,
  CalendarClock,
  Swords,
  Map,
  Library,
  Activity,
  Archive,
  LayoutTemplate,
  Award,
  Image,
  Wrench,
  Ticket,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { PermAction } from "@/types/permissions";
import { RankMappingsPage } from "@/routes/members/config/rank-mappings";
import { PermissionsPage } from "@/routes/members/config/permissions";
import { DiscordConfigPage } from "@/routes/members/config/discord-config";
import { RankingPage } from "@/routes/members/config/ranking";
import { TicketConfigPage } from "@/routes/members/config/ticket-config";
import { StaffCompetitionsPage } from "@/routes/members/config/competitions";
import { CompSchedulePage } from "@/routes/members/config/competition-schedule";
import { BallotTokensConfigPage } from "@/routes/members/config/ballot-tokens";
import { StaffFrenzyPage } from "@/routes/members/config/frenzy";
import { StaffTileracePage } from "@/routes/members/config/tilerace";
import { TileRepositoryPage } from "@/routes/members/config/tile-repository";
import { ServicesPage } from "@/routes/members/config/services";
import { StaffContentPage } from "@/routes/members/config/content";
import { PanelConfigPage } from "@/routes/members/config/panel";
import { ReferenceDataPage } from "@/routes/members/config/reference";
import { BadgesPage } from "@/routes/staff-portal/badges";
import { AssetManagerPage } from "@/routes/staff-portal/assets";
import { RuneliteConfigsPage } from "@/routes/staff-portal/runelite-configs";

export const CONFIG_GROUPS = [
  "Site Config",
  "Discord Config",
  "Events & Competitions",
  "Components & Content",
] as const;

export type ConfigGroup = (typeof CONFIG_GROUPS)[number];

export interface ConfigPage {
  id: string;
  label: string;
  icon: LucideIcon;
  pageId: string;
  group: ConfigGroup;
  redirectTo?: string;
  Component: ComponentType;
}

export const CONFIG_PAGES: ConfigPage[] = [
  { id: "permissions", label: "Permissions", icon: Lock, pageId: "staff.permissions", group: "Site Config", Component: PermissionsPage },
  { id: "ranking", label: "Ranking", icon: BarChart2, pageId: "staff.ranking", group: "Site Config", redirectTo: "/members", Component: RankingPage },
  { id: "services", label: "Services", icon: Activity, pageId: "staff.services", group: "Site Config", redirectTo: "/members", Component: ServicesPage },

  { id: "discord-config", label: "Discord Config", icon: Bot, pageId: "staff.discord-config", group: "Discord Config", Component: DiscordConfigPage },
  { id: "rank-mappings", label: "Rank Mappings", icon: ArrowRightLeft, pageId: "staff.rank-mappings", group: "Discord Config", Component: RankMappingsPage },
  { id: "ticket-config", label: "Ticket Config", icon: Cog, pageId: "staff.ticket-config", group: "Discord Config", redirectTo: "/members", Component: TicketConfigPage },
  { id: "panel", label: "Info Panel", icon: LayoutTemplate, pageId: "staff.panel", group: "Discord Config", redirectTo: "/members", Component: PanelConfigPage },

  { id: "competitions", label: "Competitions", icon: Trophy, pageId: "staff.competitions", group: "Events & Competitions", Component: StaffCompetitionsPage },
  { id: "competition-schedule", label: "Comp Schedule", icon: CalendarClock, pageId: "staff.comp-schedule", group: "Events & Competitions", Component: CompSchedulePage },
  { id: "frenzy", label: "PVM Frenzy", icon: Swords, pageId: "frenzy.admin", group: "Events & Competitions", Component: StaffFrenzyPage },
  { id: "tilerace", label: "Tile Race", icon: Map, pageId: "tilerace.admin", group: "Events & Competitions", Component: StaffTileracePage },
  { id: "tile-repository", label: "Tile Repository", icon: Library, pageId: "staff.tile-repository", group: "Events & Competitions", Component: TileRepositoryPage },
  { id: "ballot-tokens", label: "Ballot Tokens", icon: Ticket, pageId: "staff.ballot-tokens", group: "Events & Competitions", Component: BallotTokensConfigPage },

  { id: "content", label: "Content", icon: Archive, pageId: "staff.content", group: "Components & Content", Component: StaffContentPage },
  { id: "assets", label: "Asset Library", icon: Image, pageId: "staff.assets", group: "Components & Content", Component: AssetManagerPage },
  { id: "badges", label: "Badges", icon: Award, pageId: "staff.badges", group: "Components & Content", Component: BadgesPage },
  { id: "runelite-configs", label: "RuneLite Configs", icon: Wrench, pageId: "staff.runelite_configs", group: "Components & Content", Component: RuneliteConfigsPage },
  { id: "reference-data", label: "Reference Data", icon: BookOpen, pageId: "staff.reference-data", group: "Components & Content", redirectTo: "/members", Component: ReferenceDataPage },
];

type HasPermission = (pageId: string, action: PermAction, roles: string[]) => boolean;

export function hasControlPanelAccess(hasPermission: HasPermission, roles: string[]): boolean {
  return CONFIG_PAGES.some((page) => hasPermission(page.pageId, "read", roles));
}
