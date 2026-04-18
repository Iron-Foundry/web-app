import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { SubNav } from "./SubNav";

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <SubNav />
      <main className="flex flex-col flex-1 min-h-0 overflow-auto p-6">{children}</main>
    </div>
  );
}
