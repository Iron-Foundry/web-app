import { Users } from "lucide-react";
import { shineHandlers } from "@/hooks/useShineEffect";
import sapphireImg from "@/assets/renders/Sapphire256.apng";
import emeraldImg from "@/assets/renders/Emerald256.apng";
import rubyImg from "@/assets/renders/Ruby256.apng";
import diamondImg from "@/assets/renders/Diamond256.apng";
import dragonstoneImg from "@/assets/renders/Dragonstone256.apng";
import onyxImg from "@/assets/renders/Onyx256.apng";
import zenyteImg from "@/assets/renders/Zenyte256.apng";

const PROGRESSION_RANKS = [
  { name: "Achiever",    img: null,           icon: Users, description: "Social rank for those who just want to hang out or haven't hit Sapphire requirements yet." },
  { name: "Sapphire",    img: sapphireImg,    description: "Early-to-mid game PvM. Accounts nudging past the quest grind and into bossing." },
  { name: "Emerald",     img: emeraldImg,     description: "Mid game ready. Comfortable with gear-heavy bosses and dipping into ToA." },
  { name: "Ruby",        img: rubyImg,        description: "Stepping into Chambers of Xeric and pushing invocations in Tombs of Amascut." },
  { name: "Diamond",     img: diamondImg,     description: "Geared and confident tackling most of what the game has to offer." },
  { name: "Dragonstone", img: dragonstoneImg, description: "Proficient raider. Challenge Modes or pushing into Combat Achievements." },
  { name: "Onyx",        img: onyxImg,        description: "Skilled and geared for anything the game throws at you." },
  { name: "Zenyte",      img: zenyteImg,      description: "Inferno, Colosseum, Grandmaster CAs. Our most prestigious rank." },
] as const;

export function RankSection() {
  return (
    <section className="space-y-4">
      <h2 className="font-rs-bold text-3xl text-primary">Rank Structure</h2>
      <div className="grid grid-cols-2 gap-3 items-stretch">
        {PROGRESSION_RANKS.map((rank) => (
          <div
            key={rank.name}
            className="stat-card shine-border h-full"
            {...shineHandlers}
          >
            <div className="flex items-center gap-4 rounded-[10px] border border-border bg-card px-4 py-4 cursor-default min-h-[96px] max-h-[112px] overflow-hidden">
              <div className="relative shrink-0 h-10 w-10 flex items-center justify-center">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-2 rounded-full bg-black/50 blur-sm" />
                {"icon" in rank && rank.icon
                  ? <rank.icon className="relative h-10 w-10 text-primary" />
                  : rank.img && <img src={rank.img} alt={rank.name} className="relative h-10 w-10 object-contain scale-[1.4]" />
                }
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-rs-bold text-lg text-primary leading-tight">{rank.name}</span>
                {rank.description && <span className="text-sm text-muted-foreground line-clamp-2">{rank.description}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
