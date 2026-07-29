import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMusic } from "@/context/MusicContext";
import { useMusicActivity } from "@/hooks/useMusic";
import { NoSession } from "./NoSession";
import { SessionSwitcher } from "./SessionSwitcher";

export function ActivityPage(): React.ReactElement {
  const { session, channelId } = useMusic();
  const { data: entries, isLoading } = useMusicActivity(
    channelId,
    session !== null,
  );

  if (!session) return <NoSession />;

  return (
    <div className="space-y-6">
      <SessionSwitcher />

      <Card className="p-6">
        <p className="font-rs-bold text-primary">Recent activity</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Kept only while the session is alive, and never written to the
          database.
        </p>
        <Separator className="my-4" />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (entries ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="space-y-2">
            {(entries ?? []).map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex gap-3 text-sm">
                <time
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                  dateTime={entry.at}
                >
                  {new Date(entry.at).toLocaleTimeString()}
                </time>
                <span className="min-w-0">
                  <span className="text-foreground">
                    {entry.actor_name || entry.actor_id}
                  </span>{" "}
                  {entry.action}
                  {entry.detail && (
                    <span className="text-muted-foreground">
                      {" "}
                      - {entry.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
