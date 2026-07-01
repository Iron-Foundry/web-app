import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Swords, BookOpen, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WOM_RANK_COLOR, GEM_RANK_COLOR } from "@/lib/leaderboardRanks";
import { fmtNum } from "@/components/leaderboards/RankRow";
import { bossIconUrl, skillIconUrl } from "@/lib/wikiIcons";
import { usePlayerBreakdown } from "@/hooks/useLeaderboards";
import type { RankingPlayer } from "@/types/leaderboard";

function relativeTime(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "just now";
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function fmtXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1000) return `${Math.round(xp / 1000)}k`;
  return String(Math.round(xp));
}

function fmtName(snake: string): string {
  return snake.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const TIER_GLOW: Record<number, string> = { 1: "#94a3b8", 2: "#22c55e", 3: "#3b82f6", 4: "#8b5cf6", 5: "#eab308" };

function WikiImg({ url, alt, tier }: { url: string; alt: string; tier?: number }): React.ReactElement | null {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;
  const glow = tier !== undefined ? TIER_GLOW[tier] : undefined;
  return (
    <span className="inline-flex items-center justify-center w-12 h-12 shrink-0">
      <img
        src={url}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        style={{ filter: glow ? `drop-shadow(0 0 5px ${glow}cc)` : undefined }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function RankingPlayerSheet({
  player,
  onClose,
}: {
  player: RankingPlayer | null;
  onClose: () => void;
}): React.ReactElement {
  const { data: bd, isLoading } = usePlayerBreakdown(player?.rsn ?? null);

  if (!player) return <Sheet open={false} onOpenChange={onClose}><SheetContent /></Sheet>;

  const base = player.boss_points + player.skill_points;
  const prestigeBonus = player.points - base;
  const prestigeMult = base > 0 ? player.points / base : 1;
  const hasPrestige = prestigeBonus > 0;
  const bossBarPct = player.points > 0 ? (player.boss_points / player.points) * 100 : 0;
  const skillBarPct = player.points > 0 ? (player.skill_points / player.points) * 100 : 0;
  const prestigeBarPct = player.points > 0 ? (prestigeBonus / player.points) * 100 : 0;
  const rankColor = WOM_RANK_COLOR[player.rank] ?? "text-muted-foreground";

  return (
    <Sheet open={!!player} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-10 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="font-rs-bold text-2xl text-foreground leading-tight break-all">
              {player.rsn}
            </SheetTitle>
            <span className={cn("text-sm font-semibold shrink-0 mt-1", rankColor)}>{player.rank}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {player.clan_rank && (
              <Badge variant="outline" className={cn("text-xs", GEM_RANK_COLOR[player.clan_rank])}>
                {player.clan_rank}
              </Badge>
            )}
            {player.username && <span className="text-xs text-muted-foreground">{player.username}</span>}
            <span className="text-xs text-muted-foreground ml-auto">{relativeTime(player.updated_at)}</span>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Points</p>
            <p className={cn("font-rs-bold text-5xl tabular-nums", rankColor)}>{fmtNum(player.points)}</p>
          </div>

          <div>
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <div className="bg-orange-500" style={{ width: `${bossBarPct}%` }} />
              <div className="bg-blue-500" style={{ width: `${skillBarPct}%` }} />
              {hasPrestige && <div className="bg-yellow-400" style={{ width: `${prestigeBarPct}%` }} />}
            </div>
            <div className="flex gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />PvM</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />Skilling</span>
              {hasPrestige && <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />Prestige</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Swords className="h-3.5 w-3.5" />PvM Points</p>
              <p className="font-rs-bold text-xl text-orange-500 tabular-nums">{fmtNum(player.boss_points)}</p>
              <p className="text-xs text-muted-foreground">{player.points > 0 ? Math.round((player.boss_points / player.points) * 100) : 0}% of total</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Skilling Points</p>
              <p className="font-rs-bold text-xl text-blue-500 tabular-nums">{fmtNum(player.skill_points)}</p>
              <p className="text-xs text-muted-foreground">{player.points > 0 ? Math.round((player.skill_points / player.points) * 100) : 0}% of total</p>
            </div>
          </div>

          {hasPrestige && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="text-xs font-medium text-yellow-500 mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />Prestige Active</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="text-center"><p className="text-muted-foreground mb-0.5">Base</p><p>{fmtNum(base)}</p></div>
                <div className="text-center"><p className="text-muted-foreground mb-0.5">Multiplier</p><p className="text-yellow-500 font-semibold">{prestigeMult.toFixed(4)}x</p></div>
                <div className="text-center"><p className="text-muted-foreground mb-0.5">Bonus</p><p className="text-yellow-500">+{fmtNum(prestigeBonus)}</p></div>
              </div>
            </div>
          )}

          {player.alts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Known Alts</p>
              <div className="flex flex-wrap gap-1.5">
                {player.alts.map((alt) => <Badge key={alt} variant="secondary" className="font-mono text-xs">{alt}</Badge>)}
              </div>
            </div>
          )}

          <Separator />

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />Loading breakdown...
            </div>
          ) : bd ? (
            <div className="space-y-5">
              {bd.bosses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Swords className="h-3 w-3" />PvM Breakdown
                  </p>
                  <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Boss</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">KC</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">FKB</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">KC pts</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bd.bosses.map((b) => {
                          const url = bossIconUrl(b.name);
                          return (
                            <tr key={b.name} className="hover:bg-muted/30">
                              <td className="px-2.5 py-1.5">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <WikiImg url={url} alt={fmtName(b.name)} tier={b.tier_weight} />
                                  <span className="pl-2 font-rs-bold text-sm" style={{ textShadow: "0 0 8px rgba(30,58,138,0.9), 0 0 18px rgba(30,58,138,0.5), 0 0 3px #000" }}>{fmtName(b.name)}</span>
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtNum(b.kc)}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{b.first_kill_bonus > 0 ? `+${fmtNum(Math.round(b.first_kill_bonus))}` : "-"}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtNum(Math.round(b.kc_points))}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-orange-500">{fmtNum(Math.round(b.points))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bd.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />Skilling Breakdown
                  </p>
                  <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Skill</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">XP</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">XP pts</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">99</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">200M</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bd.skills.map((s) => {
                          const url = skillIconUrl(s.name);
                          return (
                            <tr key={s.name} className="hover:bg-muted/30">
                              <td className="px-2.5 py-1.5">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <WikiImg url={url} alt={fmtName(s.name)} tier={5} />
                                  <span className="pl-2 font-rs-bold text-sm" style={{ textShadow: "0 0 8px rgba(30,58,138,0.9), 0 0 18px rgba(30,58,138,0.5), 0 0 3px #000" }}>{fmtName(s.name)}</span>
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtXp(s.xp)}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtNum(Math.round(s.xp_points))}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{s.milestone_99 > 0 ? `+${fmtNum(Math.round(s.milestone_99))}` : "-"}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{s.milestone_200m > 0 ? `+${fmtNum(Math.round(s.milestone_200m))}` : "-"}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-blue-500">{fmtNum(Math.round(s.points))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bd.prestige.some((p) => p.active) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Star className="h-3 w-3" />Prestige Unlocks
                  </p>
                  <div className="space-y-1.5">
                    {bd.prestige.filter((p) => p.active).map((p) => {
                      const url = bossIconUrl(p.boss_name);
                      return (
                        <div key={p.boss_name} className="flex items-center justify-between rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-yellow-400">
                            <WikiImg url={url} alt={fmtName(p.boss_name)} tier={5} />
                            {fmtName(p.boss_name)}
                          </span>
                          <span className="tabular-nums font-semibold text-yellow-500">{p.multiplier.toFixed(2)}x multiplier</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/30 border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Formula</p>
                <p className="text-xs font-mono text-foreground/80 leading-relaxed">
                  {fmtNum(bd.boss_points)} PvM + {fmtNum(bd.skill_points)} Skilling
                  {bd.prestige_multiplier > 1 ? (
                    <> = {fmtNum(bd.base_points)} base &times; {bd.prestige_multiplier.toFixed(4)} = <span className={rankColor}>{fmtNum(bd.total_points)}</span></>
                  ) : (
                    <> = <span className={rankColor}>{fmtNum(bd.total_points)}</span></>
                  )}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
