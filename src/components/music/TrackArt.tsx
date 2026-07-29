import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackArtProps {
  url?: string | null;
  /** Sizing, as Tailwind height and width classes. */
  className?: string;
}

/**
 * A track's cover, or a placeholder of the same size when it has none.
 *
 * Always renders a box. A track can reach the queue with no art at all - the
 * cover is only recovered when the audio is resolved at play time - and a row
 * that rendered nothing would sit out of line with the rows around it.
 */
export function TrackArt({ url, className }: TrackArtProps): React.ReactElement {
  const box = cn("shrink-0 overflow-hidden rounded-md", className);
  if (!url) {
    return (
      <div className={cn(box, "flex items-center justify-center bg-muted")}>
        <Music2 className="h-1/3 w-1/3 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img src={url} alt="" loading="lazy" className={cn(box, "object-cover")} />
  );
}
