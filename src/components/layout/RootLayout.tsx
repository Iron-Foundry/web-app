import type { ReactNode } from "react";
import { useLayout } from "@/context/LayoutContext";
import { TopNav } from "./TopNav";
import { SideNav } from "./SideNav";

export function RootLayout({ children }: { children: ReactNode }) {
  const { navLayout } = useLayout();

  if (navLayout === "sidebar") {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <SideNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    );
  }

  if (navLayout === "hybrid") {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopNav showTitle />
        <div className="flex flex-1">
          <SideNav minimal />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}