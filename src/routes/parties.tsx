import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Bell, Plus, Users } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { rootRoute } from "./__root";
import { useAuth } from "@/context/AuthContext";
import { useParties, useNotificationCategories, useNotificationPreferences, useCreateParty, useUpdateParty } from "@/hooks/useParties";
import { splitLocalDatetime } from "@/lib/parties";
import { PartySkeleton } from "@/components/skeletons/PartySkeleton";
import type { Party } from "@/types/parties";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/layout/PageHead";
import { PartyCard } from "@/components/parties/PartyCard";
import { PartyForm } from "@/components/parties/PartyForm";
import { NotificationsModal } from "@/components/parties/NotificationsModal";

export const partiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parties",
  component: () => <PartiesPage />,
});

export default function PartiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: parties = [], isLoading } = useParties();
  const { data: categories = [] } = useNotificationCategories(!!user);
  const { data: prefs } = useNotificationPreferences(!!user);
  const createParty = useCreateParty();
  const updateParty = useUpdateParty();

  const [showCreate, setShowCreate] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  function handleNotifToggle(id: string) {
    qc.setQueryData<{ category_ids: string[] }>(
      queryKeys.parties.notificationPreferences(),
      (old) => {
        const cur = old?.category_ids ?? [];
        return { category_ids: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
      },
    );
  }

  const currentUserId = user?.discord_user_id ?? null;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead title="Active Parties" lede="Set up a group for when you get off work, schedule some niche content or just send tob with the boys." />
        {user ? (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => setShowNotifications(true)}>
              <Bell className="h-4 w-4" />Notifications
            </Button>
            <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />Create Party
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Log in to create or join parties.</p>
        )}
      </div>

      {isLoading && <PartySkeleton />}

      {!isLoading && parties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">No active parties. Be the first to start one!</p>
        </div>
      )}

      {!isLoading && parties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map(party => (
            <PartyCard key={party.id} party={party} currentUserId={currentUserId} onEdit={setEditingParty} />
          ))}
        </div>
      )}

      {showCreate && (
        <PartyForm
          title="Create a Party"
          categories={categories}
          onClose={() => setShowCreate(false)}
          showTtl
          saving={createParty.isPending}
          error={createParty.error?.message}
          onSubmit={(data) => {
            createParty.mutate(
              { ...data, ttl_hours: data.ttl_hours ?? 4 },
              { onSuccess: () => setShowCreate(false) },
            );
          }}
        />
      )}

      {editingParty && (
        <PartyForm
          title="Edit Party"
          categories={categories}
          initial={{
            activity: editingParty.activity,
            description: editingParty.description ?? "",
            vibe: editingParty.vibe,
            maxSize: editingParty.max_size,
            ...(() => { const [d, t] = splitLocalDatetime(editingParty.scheduled_at); return { scheduledDate: d, scheduledTime: t }; })(),
            selectedCategories: editingParty.notification_category_ids,
          }}
          onClose={() => setEditingParty(null)}
          saving={updateParty.isPending}
          error={updateParty.error?.message}
          onSubmit={(data) => {
            updateParty.mutate(
              { id: editingParty.id, data },
              { onSuccess: () => setEditingParty(null) },
            );
          }}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          categories={categories}
          selected={prefs?.category_ids ?? []}
          onToggle={handleNotifToggle}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
