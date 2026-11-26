import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAccounts } from "@/api/accounts";
import { SignupPanel } from "@/components/events/SignupPanel";
import { useFrenzyChangeSignup, useFrenzySignUp, useFrenzyWithdraw } from "@/hooks/useFrenzySignups";
import { queryKeys } from "@/lib/queryKeys";
import type { FrenzyActiveEvent } from "@/types/frenzy";

const toastError = (err: unknown): void => {
  toast.error(err instanceof Error ? err.message : "The signup could not be saved.");
};

/** Sign up, switch account, offer to captain or withdraw for the active frenzy event. */
export function FrenzySignup({ event }: { event: FrenzyActiveEvent }): React.ReactElement | null {
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.members.accounts(),
    queryFn: getAccounts,
    staleTime: 1000 * 60 * 5,
  });
  const signUp = useFrenzySignUp();
  const change = useFrenzyChangeSignup();
  const withdraw = useFrenzyWithdraw();
  const mine = event.my_signup;

  return (
    <SignupPanel
      open={event.signups_open}
      accounts={accounts}
      signedUp={mine !== null}
      currentAccountId={mine?.account_id ?? null}
      wantsCaptain={mine?.wants_captain ?? false}
      busy={signUp.isPending || change.isPending || withdraw.isPending}
      onSignUp={(accountId, wantsCaptain) =>
        signUp.mutate({ eventId: event.id, choice: { accountId, wantsCaptain } }, { onError: toastError })
      }
      onChange={(accountId, wantsCaptain) =>
        change.mutate({ eventId: event.id, choice: { accountId, wantsCaptain } }, { onError: toastError })
      }
      onRescind={() => withdraw.mutate(event.id, { onError: toastError })}
    />
  );
}
