import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Separator } from "@/components/ui/separator";
import ifPurple from "@/assets/IF_PURPLE.png";
import ifElectricBlue from "@/assets/IF_ELECTRIC_BLUE.png";
import ifBW from "@/assets/LogoTSPSmall-B&W-320x320.png";
import ifGreen from "@/assets/IF_GREEN.png";
import ifYellow from "@/assets/IF_YELLOW.png";
import { API_URL } from "@/context/AuthContext";

export const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: StaffPage,
});

interface StaffMember {
  name: string;
  position?: string[];
  discordId?: string;
}

interface StaffSection {
  title: string;
  icon: string;
  members: StaffMember[];
}

const STAFF: StaffSection[] = [
  {
    title: "Owners",
    icon: ifPurple,
    members: [
      { name: "Martyrs",  position: ["Co-Owner", "Expert Yapper"], discordId: "406502736528408608"    },
      { name: "Salt",     position: ["Co-Owner", "Lead Developer"], discordId: "225683257146998785"    },
    ],
  },
  {
    title: "Senior Moderators",
    icon: ifElectricBlue,
    members: [
      { name: "aBtw",     position: ["Lead Mentorships & Ranks"], discordId: "238129189234933761" },
      { name: "Ethamiel", position: ["Lead Coordinator", "Lead Events", "Lead Recruiting", "Expert Yapper"], discordId: "1266898806985986108" },
    ],
  },
  {
    title: "Moderators",
    icon: ifBW,
    members: [
      { name: "Dunkies",      position: ["General Moderator"], discordId: "262425953681145867" },
      { name: "PvM Items",    position: ["General Moderator"], discordId: "257307256016732161" },
      { name: "Gfe zanothe",  position: ["Mentorships & Ranks"], discordId: "219775913083011072" },
      { name: "Iron Pyke",    position: ["Mentorships & Ranks"], discordId: "1173045051862036520" },
      { name: "LD Blowie",       position: ["Mentorships & Ranks", "Tickets & Support"], discordId: "185151555480190976" },
      { name: "Major Mahi",   position: ["Tickets & Support"], discordId: "117672374362439684" },
      { name: "Turbobungus",  position: ["Events"], discordId: "526978897586159627" },
      { name: "Ugly Dipshit",  position: ["Recruiting", "Coordinator", "Social Media"], discordId: "126047413113716736" },
      { name: "Ponderrr",  position: ["Recruiting", "Tickets & Support"], discordId: "1221565409359040604" },
      { name: "MadMike887",  position: ["Recruiting"], discordId: "275911716192124929" },
      { name: "Very Niceuuu",  position: ["Lead Community Activities", "Events"], discordId: "294951214314029056" },
    ],
  },
  {
    title: "Event Team",
    icon: ifGreen,
      members: [
        { name: "Ursaring",   position: ["Large Scale", "Small Scale"], discordId: "334193733627150338" },
        { name: "M imik",   position: ["Large Scale", "Community Events"], discordId: "311546073737068546" },
        { name: "Bimmo",   position: ["Large Scale"], discordId: "147852591244640256" },
        { name: "Effort Low",   position: ["Large Scale"], discordId: "611981968506224640" },
    ],
  },
  {
    title: "Mentors",
    icon: ifYellow,
      members: [
        { name: "Soklyve",   position: [], discordId: "1117209236829650984" },
        { name: "BromieJuan",   position: [], discordId: "241381729187659787" },
        { name: "Goon Knight",   position: [], discordId: "1419350610200887327" },
        { name: "Hyuacktuah",   position: [], discordId: "95867178078732288" },
        { name: "Ursaring",   position: [], discordId: "334193733627150338" },
        { name: "Sr6",   position: [], discordId: "109446695464497152" },
        { name: "Bimmo",   position: [], discordId: "147852591244640256" },
    ],
  },
];

function MemberCard({ name, position, discordId }: StaffMember) {
  const hasMultiple = position && position.length > 1;
  return (
    <div className="group relative rounded-lg border border-border bg-card px-4 py-3 min-w-40">
      <div className="flex items-center gap-2">
        {discordId && (
          <img
            src={`${API_URL}/clan/user-avatar/${discordId}`}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">{name}</span>
          {position && position.length > 0 && (
            <span className="text-xs text-muted-foreground">{position[0]}</span>
          )}
        </div>
      </div>
      {hasMultiple && (
        <div className="absolute left-0 top-full z-10 mt-1 hidden w-full rounded-lg border border-border bg-card px-4 py-2 shadow-lg group-hover:block">
          {position.slice(1).map((p) => (
            <span key={p} className="block text-xs text-muted-foreground">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Our Team</h1>
        <p className="text-muted-foreground">
          The team keeping Iron Foundry running.
        </p>
      </div>

      {STAFF.map((section, i) => (
        <div key={section.title} className="space-y-4">
          {i > 0 && <Separator />}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <img src={section.icon} alt="" className="h-14 w-14 object-contain" />
              <h2 className="font-rs-bold text-2xl text-primary">{section.title}</h2>
            </div>
            {section.members.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {section.members.map((m) => (
                  <MemberCard key={m.name} {...m} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No members listed.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
