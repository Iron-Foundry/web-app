import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { rootRoute } from "./__root";
import { membersApi } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";
import { GoalRow } from "@/components/profile/GoalRow";
import { PageHead } from "@/components/layout/PageHead";
import type { Goal } from "@/types/goals";

export const goalsRsnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goals/$token",
  component: GoalsPage,
});

const noop = (): void => {};

function GoalsPage(): React.JSX.Element {
  const { token } = goalsRsnRoute.useParams();
  const year = new Date().getFullYear();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.members.goalsByToken(token),
    queryFn: () => membersApi.getGoalsByToken(token),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const goals = (data?.goals ?? []).filter((g: Goal) => g.year === year);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-6">
      <p className="rounded-lg border border-mk-yellow/35 bg-mk-yellow/10 px-4 py-2.5 text-sm">
        Work in progress - goal tracking is still being developed.
      </p>
      <PageHead title={data?.rsn ?? "Goals"}>
        <p className="flex items-center gap-1.5 text-muted-foreground"><Target className="h-4 w-4 text-primary" />{year} Goals</p>
      </PageHead>
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-muted-foreground">Goals not found.</p>}
      {!isLoading && !isError && goals.length === 0 && (
        <p className="text-sm italic text-muted-foreground">No goals shared for {year}.</p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {goals.map((goal: Goal) => (
          <GoalRow key={goal.id} goal={goal} readonly onEdit={noop} onDelete={noop} onProgressUpdate={noop} onToggleCheck={noop} />
        ))}
      </div>
    </div>
  );
}
