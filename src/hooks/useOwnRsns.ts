import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getAccounts } from "@/api/accounts";

export function useOwnRsns(): Set<string> {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["members", "accounts"],
    queryFn: getAccounts,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  if (!data) return new Set<string>();
  return new Set(data.map((a) => a.rsn.toLowerCase()));
}
