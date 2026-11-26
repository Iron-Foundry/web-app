import type { components } from "@/api/schema";

export type DraftView = components["schemas"]["DraftView"];
export type DraftTeam = components["schemas"]["DraftTeam"];
export type DraftMember = components["schemas"]["DraftMember"];
export type DraftMode = DraftView["mode"];
export type DraftSetupBody = components["schemas"]["DraftSetupBody"];
