import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { SubNav } from "./SubNav";
import { Footer } from "./Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLayout } from "@/context/LayoutContext";

export function RootLayout({ children }: { children: ReactNode }) {
  const { hasSidebar } = useLayout();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <SubNav />
      {hasSidebar ? (
        // Sidebar pages: flex-row, sidebar spans full height, right col scrolls + owns footer
        <main className="flex flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      ) : (
        // Standard pages: single scroll column, footer below content
        <main className="flex flex-col flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
          <Footer />
        </main>
      )}
    </div>
  );
}
