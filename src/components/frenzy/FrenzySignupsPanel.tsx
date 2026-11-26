import { DraftPool } from "./draft/DraftPool";
import { useAuth } from "@/context/AuthContext";
import { useActiveSignups } from "@/hooks/useFrenzy";
import { browserTimeZone } from "@/lib/timeZones";

/** The active event's signups before the draft, strongest first, as the draft pool will show them. */
export function FrenzySignupsPanel(): React.ReactElement {
  const { user } = useAuth();
  const { data, isLoading, isError } = useActiveSignups(true);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading signups...</p>;
  if (isError || !data) return <p className="text-sm text-destructive">The signups did not load.</p>;
  const count = data.members.length;
  return (
    <DraftPool
      pool={data.members}
      signupCount={count}
      pickLabel={null}
      busy={false}
      viewer={user ? { zone: browserTimeZone(), at: new Date() } : null}
      onPick={() => undefined}
      heading={<>Signups <span className="text-sm text-muted-foreground">{count}</span></>}
    />
  );
}
