import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  History,
  ListMusic,
  ListVideo,
  Play,
  type LucideIcon,
} from "lucide-react";
import { ActivityPage } from "./ActivityPage";
import { HistoryPage } from "./HistoryPage";
import { NowPlayingPage } from "./NowPlayingPage";
import { PlaylistsPage } from "./PlaylistsPage";
import { QueuePage } from "./QueuePage";
import { StatsPage } from "./StatsPage";

export const MUSIC_GROUPS = ["Session", "Library"] as const;

export type MusicGroup = (typeof MUSIC_GROUPS)[number];

export interface MusicPage {
  id: string;
  label: string;
  icon: LucideIcon;
  group: MusicGroup;
  Component: ComponentType;
}

/** Typed as non-empty so the panel always has a page to fall back to. */
export const MUSIC_PAGES: [MusicPage, ...MusicPage[]] = [
  { id: "now-playing", label: "Now Playing", icon: Play, group: "Session", Component: NowPlayingPage },
  { id: "queue", label: "Queue", icon: ListVideo, group: "Session", Component: QueuePage },
  { id: "history", label: "History", icon: History, group: "Session", Component: HistoryPage },
  { id: "playlists", label: "Playlists", icon: ListMusic, group: "Library", Component: PlaylistsPage },
  { id: "activity", label: "Activity", icon: Activity, group: "Library", Component: ActivityPage },
  // In Library rather than Session: the counters outlive every session, and the
  // page reads the same whether or not anything is playing.
  { id: "stats", label: "Clan Stats", icon: BarChart3, group: "Library", Component: StatsPage },
];
