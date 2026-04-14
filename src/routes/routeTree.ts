import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";
import { authCallbackRoute } from "./auth-callback";
import { loginRoute } from "./login";
import { membersLayoutRoute } from "./members/_layout";
import { membersDashboardRoute } from "./members/index";
import { membersSettingsRoute } from "./members/settings";
import { membersTicketsRoute } from "./members/tickets";

const membersTree = membersLayoutRoute.addChildren([
  membersDashboardRoute,
  membersSettingsRoute,
  membersTicketsRoute,
]);

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  rulesRoute,
  staffRoute,
  eventsRoute,
  authCallbackRoute,
  loginRoute,
  membersTree,
]);
