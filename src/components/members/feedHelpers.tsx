import { useState } from "react";
import type { FeedItem } from "@/types/members";
import {
  Gem, TrendingUp, Zap, ScrollText, Map, Swords,
  Heart, BookOpen, FileSearch, Skull, Timer, Flame, KeyRound, UserPen,
  Shield, Award, Compass,
} from "lucide-react";

export const FEED_META: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  drop:               { icon: Gem,        color: "text-yellow-400", badge: "Loot"       },
  level:              { icon: TrendingUp, color: "text-green-400",  badge: "Level Up"   },
  xp_milestone:       { icon: Zap,        color: "text-blue-400",   badge: "XP"         },
  quest:              { icon: ScrollText, color: "text-amber-400",  badge: "Quest"      },
  diary:              { icon: Map,        color: "text-orange-400", badge: "Diary"      },
  combat_achievement: { icon: Swords,     color: "text-red-400",    badge: "CA"         },
  pet:                { icon: Heart,      color: "text-pink-400",   badge: "Pet"        },
  collection_log:     { icon: BookOpen,   color: "text-purple-400", badge: "Log Slot"   },
  clue:               { icon: FileSearch, color: "text-teal-400",   badge: "Clue"       },
  pk:                 { icon: Skull,      color: "text-red-500",    badge: "PK"         },
  personal_best:      { icon: Timer,      color: "text-cyan-400",   badge: "PB"         },
  hcim_death:         { icon: Flame,      color: "text-red-600",    badge: "HCIM Death" },
  loot_key:           { icon: KeyRound,   color: "text-yellow-500", badge: "Loot Key"   },
  unknown:            { icon: Gem,        color: "text-muted-foreground", badge: "Unknown" },
  name_change:        { icon: UserPen,    color: "text-sky-400",    badge: "Name Change" },
  league_relic:       { icon: Shield,     color: "text-amber-400",  badge: "Leagues"    },
  league_rank:        { icon: Award,      color: "text-violet-400", badge: "Leagues"    },
  league_area:        { icon: Compass,    color: "text-emerald-400",badge: "Leagues"    },
};
export const FALLBACK_META = { icon: Gem, color: "text-muted-foreground", badge: "Unknown" };

const WIKI = "https://oldschool.runescape.wiki/images";

function wikiIconUrl(type: string, label: string): string | null {
  const slug = label.replace(/ /g, "_");
  switch (type) {
    case "drop": case "clue": case "loot_key": return `${WIKI}/${slug}.png`;
    case "level": return label === "Total Level" ? `${WIKI}/Stats_icon.png` : `${WIKI}/${slug}_icon.png`;
    case "xp_milestone": return `${WIKI}/${slug}_icon.png`;
    case "quest": return `${WIKI}/${slug}_reward_scroll.png`;
    case "collection_log": return `${WIKI}/${slug}_detail.png`;
    default: return null;
  }
}

export function FeedIcon({ type, label, Fallback, className }: {
  type: string; label: string; Fallback: React.ElementType; className?: string;
}): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const url = wikiIconUrl(type, label);
  if (failed || !url) return <Fallback className={className} />;
  return <img src={url} alt="" className="h-4 w-4 shrink-0 object-contain" onError={() => setFailed(true)} />;
}

export function formatGp(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const secs = parseFloat((s % 60).toFixed(3));
  return m > 0 ? `${m}m ${secs}s` : `${secs}s`;
}

export function formatValue(item: FeedItem): string | null {
  if (item.value == null) return null;
  switch (item.type) {
    case "drop": case "clue": case "pk": case "loot_key": return `${formatGp(item.value)} gp`;
    case "level": return `Level ${item.value}`;
    case "xp_milestone": return `${formatGp(item.value)} xp`;
    case "personal_best": return formatTime(item.value);
    default: return null;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtFullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
