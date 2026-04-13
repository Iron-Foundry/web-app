import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopNav />
      <main className="flex flex-col flex-1 p-6">{children}</main>
    </div>
  );
}
