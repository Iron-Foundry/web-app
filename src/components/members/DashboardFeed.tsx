import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FeedItem } from "@/types/members";
import { FEED_META, FALLBACK_META, FeedIcon, formatValue, timeAgo, fmtFullDate } from "./feedHelpers";
import { Panel } from "./Panel";

const FEED_LIMIT = 10;

interface Props {
  feed: FeedItem[];
  hasRsn: boolean;
  loading: boolean;
  onShowAll: () => void;
}

function FeedRow({ item }: { item: FeedItem }): React.ReactElement {
  const meta = FEED_META[item.type] ?? FALLBACK_META;
  const value = formatValue(item);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <li className="grid cursor-default grid-cols-feed-row items-center gap-3 py-2 text-sm sm:grid-cols-feed-row-typed">
          <FeedIcon type={item.type} label={item.label} Fallback={meta.icon} className={`h-4 w-4 shrink-0 ${meta.color}`} />
          <span className={`hidden text-xs font-semibold sm:block ${meta.color}`}>{meta.badge}</span>
          <span className="truncate">
            {item.label}
            {item.detail && <span className="ml-2 text-muted-foreground">{item.detail}</span>}
          </span>
          <span className={`whitespace-nowrap font-rs-bold ${meta.color}`}>{value}</span>
          <span className="text-right text-xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
        </li>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-64 space-y-1.5 p-3">
        <p className={`text-xs font-semibold ${meta.color}`}>{meta.badge}</p>
        <p className="text-sm font-medium text-popover-foreground">{item.label}</p>
        {item.rsn && <p className="text-xs text-muted-foreground">Account: <span className="font-medium text-foreground">{item.rsn}</span></p>}
        {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
        {value && <p className={`font-rs-bold text-sm ${meta.color}`}>{value}</p>}
        <p className="border-t border-border pt-1.5 text-xs text-muted-foreground">{fmtFullDate(item.timestamp)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function FeedBody({ feed, hasRsn, loading }: Omit<Props, "onShowAll">): React.ReactElement {
  if (!hasRsn) {
    return (
      <p className="text-sm text-muted-foreground">
        Link your RSN in <Link to="/members/settings" className="text-foreground underline">Settings</Link> to see your activity feed.
      </p>
    );
  }
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (feed.length === 0) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  return (
    <TooltipProvider delayDuration={300}>
      <ul className="divide-y divide-border">
        {feed.slice(0, FEED_LIMIT).map((item) => (
          <FeedRow key={`${item.timestamp}-${item.type}-${item.label}`} item={item} />
        ))}
      </ul>
    </TooltipProvider>
  );
}

/** The newest feed events, with the full history one press away. */
export function DashboardFeed({ onShowAll, ...body }: Props): React.ReactElement {
  const hidden = body.feed.length - FEED_LIMIT;
  return (
    <Panel
      title="Your Activity Feed"
      more={body.hasRsn && hidden > 0 ? { label: `Show ${hidden} more events...`, onClick: onShowAll } : null}
    >
      <FeedBody {...body} />
    </Panel>
  );
}
