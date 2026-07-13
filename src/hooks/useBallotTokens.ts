import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ballotTokensApi } from "@/api/ballotTokens";
import { queryKeys } from "@/lib/queryKeys";
import type { BallotTokenConfig } from "@/types/ballotTokens";

export function useBallotTokens(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.ballotTokens.me(),
    queryFn: ballotTokensApi.me,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useBallotTokenConfig(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.ballotTokens.config(),
    queryFn: ballotTokensApi.getConfig,
    enabled,
  });
}

export function useSaveBallotTokenConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BallotTokenConfig) => ballotTokensApi.setConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ballotTokens.config() });
      toast.success("Ballot token config saved.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
