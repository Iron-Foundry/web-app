import { cn } from "@/lib/utils";
import { TileMarkerEmbed } from "./TileMarkerEmbed";

const ALIGN: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

interface TileMarkerEmbedGroupProps {
  ids: string[];
  align?: string;
}

/**
 * Lays out one or more tile marker embeds in rows of up to three, honoring the
 * requested horizontal alignment. Consecutive markdown embeds render through here.
 */
export function TileMarkerEmbedGroup({ ids, align = "left" }: TileMarkerEmbedGroupProps) {
  return (
    <div className={cn("my-4 flex flex-wrap gap-3", ALIGN[align] ?? ALIGN.left)}>
      {ids.map((id) => (
        <div key={id} className="w-full sm:w-[calc(33.333%-0.5rem)] sm:max-w-72">
          <TileMarkerEmbed configId={id} embedded />
        </div>
      ))}
    </div>
  );
}
