import ifPurple from "@/assets/IF_PURPLE.png";
import ifElectricBlue from "@/assets/IF_ELECTRIC_BLUE.png";
import ifBW from "@/assets/LogoTSPSmall-B&W-320x320.png";
import ifGreen from "@/assets/IF_GREEN.png";
import ifYellow from "@/assets/IF_YELLOW.png";

export interface StaffMember {
  name: string;
  position?: string[];
  discordId?: string;
}

export interface StaffSection {
  title: string;
  icon: string;
  members: StaffMember[];
}

export const STAFF: StaffSection[] = [
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
        { name: "Effort Low", position: ["Large Scale"], discordId: "611981968506224640" },
        {name: "Hard4Huey", position: ["Large Scale", "Small Scale"], discordId: "191741131841601536"}
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
        { name: "Bimmo", position: [], discordId: "147852591244640256" },
        { name: "Jake", position: [], discordId: "701159674829078559"}
    ],
    },
    {
        title: "Site Editors",
        icon: ifPurple,
        members: [
            { name: "Hyuacktuah", position: [], discordId: "95867178078732288" },
            { name: "Sorbella", position: [], discordId: "321291670895460354" },
            { name: "Jake", position: [], discordId: "701159674829078559" },
            { name: "Fish Tofu", position: [], discordId: "140828842779607040"}
        ]
  }
];
