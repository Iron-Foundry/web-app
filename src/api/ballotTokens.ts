import { apiFetch } from "./client";
import type {
  BallotTokenBalance,
  BallotTokenConfig,
} from "@/types/ballotTokens";

export const ballotTokensApi = {
  me: () => apiFetch<BallotTokenBalance>("/clan/ballot-tokens/me"),

  getConfig: () => apiFetch<BallotTokenConfig>("/config/ballot-tokens"),

  setConfig: (data: BallotTokenConfig) =>
    apiFetch<BallotTokenConfig>("/config/ballot-tokens", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
