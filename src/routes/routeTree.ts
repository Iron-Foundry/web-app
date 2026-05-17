import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";
import { authCallbackRoute } from "./auth-callback";
import { loginRoute } from "./login";
import { leaderboardsRoute } from "./leaderboards";
import { partiesRoute } from "./parties";
import { competitionsRoute } from "./competitions";
import { competitionDetailRoute } from "./competitions.$compId";
import { bingoRoute } from "./bingo";
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
import { staffRankMappingsRoute } from "./members/staff/rank-mappings";
import { staffPermissionsRoute } from "./members/staff/permissions";
import { staffDiscordConfigRoute } from "./members/staff/discord-config";
import { staffContentRoute } from "./members/staff/content";
import { staffCompetitionsRoute } from "./members/staff/competitions";
import { membersSurveysRoute } from "./members/surveys";
import { membersApplicationsRoute } from "./members/applications";
import { surveyDetailRoute } from "./members/surveys.$templateId";
import { applicationDetailRoute } from "./members/applications.$templateId";
import { staffPortalLayoutRoute } from "./staff-portal/_layout";
import { staffPortalIndexRoute } from "./staff-portal/index";
import { staffPortalMembersRoute } from "./staff-portal/members";
import { staffPortalAllTicketsRoute } from "./staff-portal/all-tickets";
import { staffPortalSurveysRoute } from "./staff-portal/surveys";
import { staffPortalBadgesRoute } from "./staff-portal/badges";
import { staffPortalAssetsRoute } from "./staff-portal/assets";
import { staffPortalResourcesLayoutRoute } from "./staff-portal/resources/_layout";
import { staffPortalResourcesIndexRoute } from "./staff-portal/resources/index";
import { staffPortalResourcesEntryRoute } from "./staff-portal/resources/$slug";
import { staffPortalRankingRoute } from "./staff-portal/ranking";

const staffPortalResourcesTree = staffPortalResourcesLayoutRoute.addChildren([
  staffPortalResourcesIndexRoute,
  staffPortalResourcesEntryRoute,
]);

const staffPortalTree = staffPortalLayoutRoute.addChildren([
  staffPortalIndexRoute,
  staffPortalMembersRoute,
  staffPortalAllTicketsRoute,
  staffPortalSurveysRoute,
  staffPortalBadgesRoute,
  staffPortalAssetsRoute,
  staffPortalResourcesTree,
  staffPortalRankingRoute,
]);

const membersTree = membersLayoutRoute.addChildren([
  membersDashboardRoute,
  membersSettingsRoute,
  membersTicketsRoute,
  membersSurveysRoute,
  surveyDetailRoute,
  membersApplicationsRoute,
  applicationDetailRoute,
  staffRankMappingsRoute,
  staffPermissionsRoute,
  staffDiscordConfigRoute,
  staffContentRoute,
  staffCompetitionsRoute,
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
  partiesRoute,
  competitionsRoute,
  competitionDetailRoute,
  bingoRoute,
  pluginsTree,
  resourcesTree,
  membersTree,
  staffPortalTree,
]);
