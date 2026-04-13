import { rootRoute } from "./__root";
import { homeRoute } from "./home";
import { aboutRoute } from "./about";
import { rulesRoute } from "./rules";
import { staffRoute } from "./staff";
import { eventsRoute } from "./events";

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  rulesRoute,
  staffRoute,
  eventsRoute,
]);