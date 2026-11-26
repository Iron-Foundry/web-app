import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSwitch } from "./AccountSwitch";
import { useMySnapshot } from "@/hooks/useMemberDashboard";
import { SKILLS, levelFromXp, skillIconUrl } from "@/lib/osrs";
import type { LinkedAccount } from "@/api/accounts";

function SkillCell({ skillKey, label, wikiSlug, xp }: {
  skillKey: string;
  label: string;
  wikiSlug: string;
  xp: number;
}): React.JSX.Element {
  const level = levelFromXp(xp);
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <div
      title={`${label}: ${xp.toLocaleString()} XP`}
      className="flex items-center gap-1.5 rounded px-2 py-1.5 bg-muted/40 hover:bg-muted/70 transition-colors"
    >
      {!iconFailed && (
        <img
          src={skillIconUrl(wikiSlug)}
          alt={label}
          className="h-5 w-5 shrink-0 object-contain"
          onError={() => setIconFailed(true)}
          key={skillKey}
        />
      )}
      <span className="font-rs-bold text-sm text-foreground tabular-nums">{level}</span>
    </div>
  );
}

/** OSRS skills tab-style grid showing level per skill for a linked account. */
export function SkillsCard({ accounts }: { accounts: LinkedAccount[] }): React.JSX.Element | null {
  const primary = accounts.find((a) => a.is_primary) ?? accounts[0];
  const [selectedRsn, setSelectedRsn] = useState(primary?.rsn ?? "");

  const { data: snapshot } = useMySnapshot(selectedRsn || null);

  if (!snapshot) return null;

  const totalLevel = SKILLS.reduce((sum, s) => sum + levelFromXp(snapshot.skills[s.key] ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-rs-bold text-xl text-foreground">Skills</CardTitle>
          <span className="text-sm text-muted-foreground">
            Total <span className="font-rs-bold text-primary">{totalLevel.toLocaleString()}</span>
          </span>
        </div>
        <AccountSwitch accounts={accounts} selected={selectedRsn} onSelect={setSelectedRsn} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-1">
          {SKILLS.map((skill) => (
            <SkillCell
              key={skill.key}
              skillKey={skill.key}
              label={skill.label}
              wikiSlug={skill.wikiSlug}
              xp={snapshot.skills[skill.key] ?? 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
