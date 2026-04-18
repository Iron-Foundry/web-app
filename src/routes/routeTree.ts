import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";
import { authCallbackRoute } from "./auth-callback";
import { loginRoute } from "./login";
import { leaderboardsRoute } from "./leaderboards";
import { pluginsLayoutRoute } from "./plugins/_layout";
import { pluginsIndexRoute } from "./plugins/index";
import { pluginsEntryRoute } from "./plugins/$entryId";
import { resourcesLayoutRoute } from "./resources/_layout";
import { resourcesIndexRoute } from "./resources/index";
import { resourcesEntryRoute } from "./resources/$entryId";
import { membersLayoutRoute } from "./members/_layout";
import { membersDashboardRoute } from "./members/index";
import { membersSettingsRoute } from "./members/settings";
import { membersTicketsRoute } from "./members/tickets";
import { staffIndexRoute } from "./members/staff/index";
import { staffMembersRoute } from "./members/staff/members";
import { staffAllTicketsRoute } from "./members/staff/all-tickets";
import { staffSurveysRoute } from "./members/staff/surveys";
import { staffRankMappingsRoute } from "./members/staff/rank-mappings";
import { staffPermissionsRoute } from "./members/staff/permissions";
import { staffBadgesRoute } from "./members/staff/badges";
import { membersSurveysRoute } from "./members/surveys";
import { membersApplicationsRoute } from "./members/applications";
import { surveyDetailRoute } from "./members/surveys.$templateId";
import { applicationDetailRoute } from "./members/applications.$templateId";

const membersTree = membersLayoutRoute.addChildren([
  membersDashboardRoute,
  membersSettingsRoute,
  membersTicketsRoute,
  membersSurveysRoute,
  surveyDetailRoute,
  membersApplicationsRoute,
  applicationDetailRoute,
  staffIndexRoute,
  staffMembersRoute,
  staffAllTicketsRoute,
  staffSurveysRoute,
  staffRankMappingsRoute,
  staffPermissionsRoute,
  staffBadgesRoute,
]);

const pluginsTree = pluginsLayoutRoute.addChildren([pluginsIndexRoute, pluginsEntryRoute]);
const resourcesTree = resourcesLayoutRoute.addChildren([resourcesIndexRoute, resourcesEntryRoute]);

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  rulesRoute,
  staffRoute,
  eventsRoute,
  authCallbackRoute,
  loginRoute,
  leaderboardsRoute,
  pluginsTree,
  resourcesTree,
  membersTree,
]);
