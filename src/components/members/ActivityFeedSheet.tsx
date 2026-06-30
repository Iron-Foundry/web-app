import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FeedItem } from "@/types/members";
import {
  FEED_META, FALLBACK_META, FeedIcon,
  formatValue, timeAgo, fmtFullDate,
} from "./feedHelpers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feed: FeedItem[];
}

/** Full historical activity sheet - all accounts, all events. */
export function ActivityFeedSheet({ open, onOpenChange, feed }: Props): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
          <SheetTitle className="font-rs-bold text-2xl text-primary">Activity History</SheetTitle>
          <p className="text-sm text-muted-foreground">{feed.length} events across all linked accounts</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {feed.length === 0
            ? <p className="px-6 py-8 text-sm text-muted-foreground">No activity recorded yet.</p>
            : (
              <TooltipProvider delayDuration={300}>
                <ul className="divide-y divide-border">
                  {feed.map((item, i) => {
                    const meta = FEED_META[item.type] ?? FALLBACK_META;
                    const Icon = meta.icon;
                    const value = formatValue(item);
                    return (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <li className="flex items-center gap-3 px-6 py-2 cursor-default hover:bg-muted/30 transition-colors">
                            <span className="w-4 shrink-0 flex items-center justify-center">
                              <FeedIcon type={item.type} label={item.label} Fallback={Icon}
                                className={`h-4 w-4 ${meta.color}`} />
                            </span>
                            <Badge variant="link" className="shrink-0 text-[10px] w-16 justify-center">{meta.badge}</Badge>
                            <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{item.label}</span>
                            <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5 truncate">
                              {item.rsn ?? ""}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="w-24 text-xs text-muted-foreground truncate">{item.detail ?? ""}</span>
                              <span className={`w-20 font-rs-bold text-sm text-right ${meta.color}`}>{value ?? ""}</span>
                            </span>
                            <span className="w-14 shrink-0 text-xs text-muted-foreground text-right">{timeAgo(item.timestamp)}</span>
                          </li>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-64 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                            <span className={`text-xs font-semibold ${meta.color}`}>{meta.badge}</span>
                          </div>
                          <p className="text-sm font-medium text-popover-foreground">{item.label}</p>
                          {item.rsn && (
                            <p className="text-xs text-muted-foreground">Account: <span className="font-medium text-foreground">{item.rsn}</span></p>
                          )}
                          {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                          {value && <p className={`text-sm font-rs-bold ${meta.color}`}>{value}</p>}
                          <p className="text-xs text-muted-foreground border-t border-border pt-1.5">{fmtFullDate(item.timestamp)}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </ul>
              </TooltipProvider>
            )
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
