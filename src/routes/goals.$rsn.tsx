import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "./__root";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Target } from "lucide-react";
import { membersApi } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";
import { GoalRow } from "@/components/profile/GoalRow";
import type { Goal } from "@/types/goals";

export const goalsRsnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goals/$token",
  component: GoalsPage,
});

function GoalsPage(): React.JSX.Element {
  const { token } = goalsRsnRoute.useParams();
  const year      = new Date().getFullYear();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.members.goalsByToken(token),
    queryFn:  () => membersApi.getGoalsByToken(token),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const goals = (data?.goals ?? []).filter((g: Goal) => g.year === year);

  return (
    <div className="mx-auto max-w-7xl py-6 space-y-6 px-4">
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-700 dark:text-yellow-400">
        Work in progress - goal tracking is still being developed.
      </div>
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">{data?.rsn ?? "Goals"}</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />{year} Goals</p>
      </div>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {isError  && <p className="text-sm text-muted-foreground">Goals not found.</p>}
          {!isLoading && !isError && goals.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No goals shared for {year}.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((goal: Goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                readonly
                onEdit={() => {}}
                onDelete={() => {}}
                onProgressUpdate={() => {}}
                onToggleCheck={() => {}}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
