import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { PageHead } from "@/components/layout/PageHead";
import { ProfileSection } from "@/components/members/settings/ProfileSection";
import { AccountsSection } from "@/components/members/settings/AccountsSection";
import { ApiKeySection } from "@/components/members/settings/ApiKeySection";
import { PrivacySection, AppearanceSection } from "@/components/members/settings/PrivacySection";

export const membersSettingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "settings",
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <PageHead title="Settings" />
      <ProfileSection />
      <AccountsSection />
      <ApiKeySection />
      <PrivacySection />
      <AppearanceSection />
    </div>
  );
}
