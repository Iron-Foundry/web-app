import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { SurveyDetailPage } from "./survey-detail";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/applications/$templateId",
  component: ApplicationDetailRouteComponent,
});

function ApplicationDetailRouteComponent() {
  const { templateId } = applicationDetailRoute.useParams();
  return <SurveyDetailPage category="application" templateId={templateId} />;
}
