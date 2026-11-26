import { LogOut, Plug } from "lucide-react";

/** The RuneLite plugin steps a member must follow for the competition to count them. */
export function PluginNotice(): React.ReactElement {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-mk-yellow/35 bg-mk-yellow/10 px-5 py-4">
      <Plug className="mt-0.5 h-5 w-5 shrink-0 text-mk-yellow" />
      <div className="space-y-2">
        <p className="font-semibold">XP Updater Plugin Required</p>
        <ul className="space-y-1.5 text-sm text-mk-body">
          <li className="flex items-start gap-2">
            <Plug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-yellow" />
            <span>Install and enable the <b className="font-semibold text-foreground">XP Updater</b> plugin in RuneLite, with the <b className="font-semibold text-foreground">WiseOldMan</b> option ticked.</span>
          </li>
          <li className="flex items-start gap-2">
            <LogOut className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-yellow" />
            <span>Log out once the competition has <b className="font-semibold text-foreground">started</b> to set your baseline snapshot.</span>
          </li>
          <li className="flex items-start gap-2">
            <LogOut className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-yellow" />
            <span>Log out before the competition <b className="font-semibold text-foreground">ends</b> to set an accurate final snapshot.</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
