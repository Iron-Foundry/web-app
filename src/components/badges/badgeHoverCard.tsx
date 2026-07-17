import DOMPurify from "dompurify";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { PlayerBadge } from "@/types/members";

interface BadgeHoverCardProps {
  badge: PlayerBadge;
  className?: string;
}

export function BadgeIcon({ icon, textColor, className }: { icon: string; textColor: string; className: string }): React.JSX.Element {
  const isSvg = icon.trimStart().startsWith("<");
  return isSvg ? (
    <span
      className={className}
      style={{ color: textColor }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
    />
  ) : (
    <img src={icon} alt="" className={`${className} object-contain`} />
  );
}

function formatAssignedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function BadgeHoverCard({ badge, className }: BadgeHoverCardProps): React.JSX.Element {
  const given = formatAssignedAt(badge.assigned_at);

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <span
          className={
            className ??
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium cursor-default"
          }
          style={{ background: badge.color, color: badge.text_color }}
        >
          {badge.icon && <BadgeIcon icon={badge.icon} textColor={badge.text_color} className="h-4 w-4 shrink-0" />}
          {badge.name}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 space-y-3">
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium w-fit"
          style={{ background: badge.color, color: badge.text_color }}
        >
          {badge.icon && <BadgeIcon icon={badge.icon} textColor={badge.text_color} className="h-6 w-6 shrink-0" />}
          {badge.name}
        </div>
        {badge.description && <p className="text-sm text-muted-foreground">{badge.description}</p>}
        {given && <p className="text-xs text-muted-foreground/70">Given on {given}</p>}
      </HoverCardContent>
    </HoverCard>
  );
}
