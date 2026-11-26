import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { registerPage } from "@/lib/permissions";
import { TemplateList } from "@/components/members/surveys/TemplateList";

registerPage({
  id: "members.surveys",
  label: "Surveys",
  description: "Member survey list and submission page.",
});

export const membersSurveysRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/surveys",
  component: () => <TemplateList category="survey" />,
});
