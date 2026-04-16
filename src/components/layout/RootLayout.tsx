import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { SubNav } from "./SubNav";

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopNav />
      <SubNav />
      <main className="flex flex-col flex-1 p-6">{children}</main>
    </div>
  );
}
