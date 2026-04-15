import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Separator } from "@/components/ui/separator";
import ifPurple from "@/assets/IF_PURPLE.png";
import ifElectricBlue from "@/assets/IF_ELECTRIC_BLUE.png";
import ifBW from "@/assets/LogoTSPSmall-B&W-320x320.png";
import ifGreen from "@/assets/IF_GREEN.png";
import ifYellow from "@/assets/IF_YELLOW.png";

export const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: StaffPage,
});

interface StaffMember {
  name: string;
  position?: string[];
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
      { name: "Martyrs",  position: ["Co-Owner", "Expert Yapper"]    },
      { name: "Salt",     position: ["Co-Owner", "Lead Developer"]    },
    ],
  },
  {
    title: "Senior Moderators",
    icon: ifElectricBlue,
    members: [
      { name: "aBtw",     position: ["Lead Mentorships & Ranks"] },
      { name: "Ethamiel", position: ["Lead Coordinator", "Lead Events", "Lead Recruiting", "Expert Yapper"] },
    ],
  },
  {
    title: "Moderators",
    icon: ifBW,
    members: [
      { name: "Dunkies",      position: ["General Moderator"] },
      { name: "PvM Items",    position: ["General Moderator"] },
      { name: "Gfe zanothe",  position: ["Mentorships & Ranks"] },
      { name: "Iron Pyke",    position: ["Mentorships & Ranks"] },
      { name: "Blowie",       position: ["Mentorships & Ranks", "Tickets & Support"] },
      { name: "Major Mahi",   position: ["Tickets & Support"] },
      { name: "Turbobungus",  position: ["Events"] },
      { name: "Ugly Dipshit",  position: ["Recruiting", "Coordinator", "Social Media"] },
      { name: "Ponderrr",  position: ["Recruiting", "Tickets & Support"] },
      { name: "MadMike887",  position: ["Recruiting"] },
      { name: "Very Niceuuu",  position: ["Lead Community Activities", "Events"] },
    ],
  },
  {
    title: "Event Team",
    icon: ifGreen,
      members: [
        { name: "Ursaring",   position: ["Large Scale", "Small Scale"] },
        { name: "M imik",   position: ["Large Scale", "Community Events"] },
        { name: "Bimmo",   position: ["Large Scale"] },
        { name: "Effort Low",   position: ["Large Scale"] },
    ],
  },
  {
    title: "Mentors",
    icon: ifYellow,
      members: [
        { name: "Soklyve",   position: [] },
        { name: "BromieJuan",   position: [] },
        { name: "Goon Knight",   position: [] },
        { name: "Hyuacktuah",   position: [] },
        { name: "Ursaring",   position: [] },
        { name: "Sr6",   position: [] },
        { name: "Bimmo",   position: [] },
    ],
  },
];

function MemberCard({ name, position }: StaffMember) {
  const hasMultiple = position && position.length > 1;
  return (
    <div className="group relative rounded-lg border border-border bg-card px-4 py-3 min-w-40">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {position && position.length > 0 && (
          <span className="text-xs text-muted-foreground">{position[0]}</span>
        )}
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
