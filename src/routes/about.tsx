import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">About Us</h1>
      <p className="text-muted-foreground">
        📜 The Legend of Marty, Bean Overlord of OSRS 📜 Hear ye, hear ye,
        scapers of Gielinor! His name… is MARTY. Clan leader, raid master,
        DEVOURER OF BEANS. While others train Strength or fish sharks… Marty
        feasts on cans of beans like they’re ancient artifacts. 🥫 Beans before
        a Chambers of Xeric fight. 🥫 Beans mid-Tombs of Amascut wipe. 🥫 Beans
        during your clan’s final boss flex because “it’s the ultimate DPS
        boost.” Legends whisper: his Vorkath kills are powered not by bolts or
        brews, but by pure leguminous energy. His raids succeed, not by skill…
        but by the eternal, mystical power of beans. Clan chat quivers when he
        types: ✨ “Beans never betray.” ✨ So when you follow Marty into raids…
        you follow not a leader, not a strategist… but a prophet of baked beans.
        🫘⚔️👑
      </p>
    </div>
  );
}
