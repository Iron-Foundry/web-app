import { Users } from "lucide-react";
import sapphireImg from "@/assets/renders/Sapphire256.apng";
import emeraldImg from "@/assets/renders/Emerald256.apng";
import rubyImg from "@/assets/renders/Ruby256.apng";
import diamondImg from "@/assets/renders/Diamond256.apng";
import dragonstoneImg from "@/assets/renders/Dragonstone256.apng";
import onyxImg from "@/assets/renders/Onyx256.apng";
import zenyteImg from "@/assets/renders/Zenyte256.apng";

const PROGRESSION_RANKS = [
  { name: "Achiever",    img: null,           tone: "text-muted-foreground", description: "Social rank for those who just want to hang out or haven't hit Sapphire requirements yet." },
  { name: "Sapphire",    img: sapphireImg,    tone: "text-mk-blue",          description: "Early-to-mid game PvM. Accounts nudging past the quest grind and into bossing." },
  { name: "Emerald",     img: emeraldImg,     tone: "text-mk-green",         description: "Mid game ready. Comfortable with gear-heavy bosses and dipping into ToA." },
  { name: "Ruby",        img: rubyImg,        tone: "text-mk-red",           description: "Stepping into Chambers of Xeric and pushing invocations in Tombs of Amascut." },
  { name: "Diamond",     img: diamondImg,     tone: "text-mk-teal",          description: "Geared and confident tackling most of what the game has to offer." },
  { name: "Dragonstone", img: dragonstoneImg, tone: "text-mk-purple",        description: "Proficient raider. Challenge Modes or pushing into Combat Achievements." },
  { name: "Onyx",        img: onyxImg,        tone: "text-mk-onyx",          description: "Skilled and geared for anything the game throws at you." },
  { name: "Zenyte",      img: zenyteImg,      tone: "text-mk-orange",        description: "Inferno, Colosseum, Grandmaster CAs. Our most prestigious rank." },
] as const;

export function RankSection() {
  return (
    <section className="space-y-5">
      <h2 className="font-rs-bold text-3xl text-foreground">Rank structure</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROGRESSION_RANKS.map((rank) => (
          <li key={rank.name} className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-card px-4 py-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center">
              {rank.img
                ? <img src={rank.img} alt={`${rank.name} rank gem`} className="h-11 w-11 scale-125 object-contain" />
                : <Users className="h-8 w-8 text-muted-foreground" />}
            </span>
            <div className="min-w-0">
              <b className={`block font-rs-bold text-xl font-normal ${rank.tone}`}>{rank.name}</b>
              <span className="text-sm text-muted-foreground">{rank.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
