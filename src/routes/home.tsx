import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import clanPhoto from "../assets/clan-photo.png";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-max space-y-8">
      <div className="space-y-2">
        <h1 className="text-7xl font-rs-bold text-primary">Iron Foundry</h1>
        <p className="text-muted-foreground">
          Welcome to Iron Foundry.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <img
          src={clanPhoto}
          alt="Iron Foundry clan photograph"
          className="h-auto w-full object-cover"
              />
              <iframe src="https://discord.com/widget?id=945052365327839254&theme=dark" width="350" height="500"frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
      </div>
    </div>
  );
}