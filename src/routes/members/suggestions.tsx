import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { registerPage } from "@/lib/permissions";
import { MemberFeedbackList } from "@/components/feedback/MemberFeedbackList";

registerPage({
  id: "members.suggestions",
  label: "Suggestions",
  description: "Submit and view clan suggestions.",
});

export const membersSuggestionsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/suggestions",
  component: () => <MemberFeedbackList type="suggestion" />,
});
