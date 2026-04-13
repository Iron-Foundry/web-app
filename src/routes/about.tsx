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
      <div className="text-white">
          <p className="text-xl py-2 text-indigo-600">📜 The Legend of Marty, Bean Overlord of OSRS 📜</p>
          
          <p className="py-2">Hear ye, hear ye, scapers of Gielinor! His name… is MARTY. Clan leader, raid master, DEVOURER OF BEANS. While others train Strength or fish sharks… Marty feasts on cans of beans like they’re ancient artifacts.</p>
          
          <p>🥫 Beans before a Chambers of Xeric fight.</p>
          <p>🥫 Beans mid-Tombs of Amascut wipe.</p>
          <p>🥫 Beans during your clan’s final boss flex because “it’s the ultimate DPS boost.”</p>
          
          <p className="py-2">Legends whisper: his Vorkath kills are powered not by bolts or brews, but by pure leguminous energy. His raids succeed, not by skill… but by the eternal, mystical power of beans.</p>
          
          <p>Clan chat quivers when he types:</p>
          <p className="text-muted-foreground">✨ “Beans never betray.” ✨</p>
          
          <p className="py-6">So when you follow Marty into raids… you follow not a leader, not a strategist… but a prophet of baked beans. 🫘⚔️👑</p>
      </div>
    </div>
  );
}
