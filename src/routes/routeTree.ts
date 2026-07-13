import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";
import { authCallbackRoute } from "./auth-callback";
import { loginRoute } from "./login";
import { leaderboardsRoute } from "./leaderboards";
import { leaderboardsPbRoute } from "./leaderboards/pb";
import { leaderboardsKcRoute } from "./leaderboards/kc";
import { leaderboardsClogRoute } from "./leaderboards/clog";
import { leaderboardsLeaguesRoute } from "./leaderboards/leagues";
import { leaderboardsRankingRoute } from "./leaderboards/ranking";
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
import { membersProfileRoute } from "./members/profile";
import { membersSettingsRoute } from "./members/settings";
import { membersTicketsRoute } from "./members/tickets";
import { frenzyRoute } from "./activities/frenzy";
import { frenzyTeamRoute } from "./activities/frenzy.$teamSlug";
import { tileraceRoute } from "./activities/tilerace";
import { goalsRsnRoute } from "./goals.$rsn";
import { membersSurveysRoute } from "./members/surveys";
import { membersApplicationsRoute } from "./members/applications";
import { membersSuggestionsRoute } from "./members/suggestions";
import { membersBugsRoute } from "./members/bugs";
import { feedbackRoute } from "./feedback";
import { mapTestRoute } from "./map-test";
import { surveyDetailRoute } from "./members/surveys.$templateId";
import { applicationDetailRoute } from "./members/applications.$templateId";
import { staffPortalLayoutRoute } from "./staff-portal/_layout";
import { staffPortalIndexRoute } from "./staff-portal/index";
import { staffPortalMembersRoute } from "./staff-portal/members";
import { staffPortalAllTicketsRoute } from "./staff-portal/all-tickets";
import { staffPortalSurveysRoute } from "./staff-portal/surveys";
import { staffPortalResourcesLayoutRoute } from "./staff-portal/resources/_layout";
import { staffPortalResourcesIndexRoute } from "./staff-portal/resources/index";
import { staffPortalResourcesEntryRoute } from "./staff-portal/resources/$slug";

const staffPortalResourcesTree = staffPortalResourcesLayoutRoute.addChildren([
  staffPortalResourcesIndexRoute,
  staffPortalResourcesEntryRoute,
]);

const staffPortalTree = staffPortalLayoutRoute.addChildren([
  staffPortalIndexRoute,
  staffPortalMembersRoute,
  staffPortalAllTicketsRoute,
  staffPortalSurveysRoute,
  staffPortalResourcesTree,
]);

const membersTree = membersLayoutRoute.addChildren([
  membersDashboardRoute,
  membersProfileRoute,
  membersSettingsRoute,
  membersTicketsRoute,
  membersSurveysRoute,
  surveyDetailRoute,
  membersApplicationsRoute,
  applicationDetailRoute,
  membersSuggestionsRoute,
  membersBugsRoute,
]);

const pluginsTree = pluginsLayoutRoute.addChildren([pluginsIndexRoute, pluginsEntryRoute]);
const resourcesTree = resourcesLayoutRoute.addChildren([resourcesIndexRoute, resourcesEntryRoute]);

const leaderboardsTree = leaderboardsRoute.addChildren([
  leaderboardsPbRoute,
  leaderboardsKcRoute,
  leaderboardsClogRoute,
  leaderboardsLeaguesRoute,
  leaderboardsRankingRoute,
]);

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  rulesRoute,
  staffRoute,
  eventsRoute,
  authCallbackRoute,
  loginRoute,
  leaderboardsTree,
  partiesRoute,
  competitionsRoute,
  competitionDetailRoute,
  bingoRoute,
  frenzyRoute,
  frenzyTeamRoute,
  tileraceRoute,
  feedbackRoute,
  mapTestRoute,
  goalsRsnRoute,
  pluginsTree,
  resourcesTree,
  membersTree,
  staffPortalTree,
]);
