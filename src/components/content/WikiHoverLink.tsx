import { useState, type ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useWikiSummary } from "@/hooks/useWikiSummary";

interface WikiHoverLinkProps {
  href: string;
  title: string;
  children: ReactNode;
}

export function WikiHoverLink({ href, title, children }: WikiHoverLinkProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useWikiSummary(title, open);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-dotted underline-offset-2 hover:no-underline"
        >
          {children}
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading preview...</p>
        ) : isError || !data ? (
          <p className="text-xs text-muted-foreground">Preview unavailable.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-3">
              {data.thumbnail && (
                <img
                  src={data.thumbnail}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md border border-border object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-rs-bold text-sm text-primary">{data.title}</p>
                <p className="line-clamp-4 text-xs text-muted-foreground">{data.extract}</p>
              </div>
            </div>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="block text-[10px] text-primary/80 hover:underline"
            >
              Read more on the OSRS Wiki
            </a>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
