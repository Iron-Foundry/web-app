import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { SurveyDetailPage } from "./survey-detail";

export const surveyDetailRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/surveys/$templateId",
  component: SurveyDetailRouteComponent,
});

function SurveyDetailRouteComponent() {
  const { templateId } = surveyDetailRoute.useParams();
  return <SurveyDetailPage category="survey" templateId={templateId} />;
}
