import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";
import { authCallbackRoute } from "./auth-callback";
import { loginRoute } from "./login";
import { leaderboardsRoute } from "./leaderboards";
import { membersLayoutRoute } from "./members/_layout";
import { membersDashboardRoute } from "./members/index";
import { membersSettingsRoute } from "./members/settings";
import { membersTicketsRoute } from "./members/tickets";
import { staffIndexRoute } from "./members/staff/index";
import { staffMembersRoute } from "./members/staff/members";
import { staffAllTicketsRoute } from "./members/staff/all-tickets";
import { membersSurveysRoute } from "./members/surveys";
import { membersApplicationsRoute } from "./members/applications";

const membersTree = membersLayoutRoute.addChildren([
  membersDashboardRoute,
  membersSettingsRoute,
  membersTicketsRoute,
  membersSurveysRoute,
  membersApplicationsRoute,
  staffIndexRoute,
  staffMembersRoute,
  staffAllTicketsRoute,
]);

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  rulesRoute,
  staffRoute,
  eventsRoute,
  authCallbackRoute,
  loginRoute,
  leaderboardsRoute,
  membersTree,
]);
