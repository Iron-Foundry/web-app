import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { registerPage } from "@/lib/permissions";
import { TemplateList } from "@/components/members/surveys/TemplateList";

registerPage({
  id: "members.applications",
  label: "Applications",
  description: "Member application list and submission page.",
});

export const membersApplicationsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/applications",
  component: () => <TemplateList category="application" />,
});
