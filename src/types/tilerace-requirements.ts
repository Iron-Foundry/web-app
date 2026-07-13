export interface LeafRequirement {
  kind: "item";
  item_id: number;
  quantity: number;
  name: string;
  icon_url: string;
}

export interface AndRequirement {
  kind: "and";
  children: RequirementNode[];
}

export interface OrRequirement {
  kind: "or";
  children: RequirementNode[];
}

export interface NotRequirement {
  kind: "not";
  child: RequirementNode;
}

export type RequirementNode =
  | LeafRequirement
  | AndRequirement
  | OrRequirement
  | NotRequirement;

export type BonusEffect = "extra_roll" | "skip_turn" | "reroll";
export type SabotageAction = "steal_progress" | "block";

export type CellModifier =
  | { type: "snakes_ladders"; target_position: number }
  | { type: "fog"; radius: number }
  | { type: "bonus_penalty"; effect: BonusEffect }
  | { type: "sabotage"; action: SabotageAction; amount: number };
