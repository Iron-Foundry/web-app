import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { registerPage } from "@/lib/permissions";
import { MemberFeedbackList } from "@/components/feedback/MemberFeedbackList";

registerPage({
  id: "members.bugs",
  label: "Bug Reports",
  description: "Submit and view bug reports.",
});

export const membersBugsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/bugs",
  component: () => <MemberFeedbackList type="bug" />,
});
