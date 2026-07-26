import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "@tanstack/react-router";
import { useLayout } from "@/context/LayoutContext";
import { ChevronLeft, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/api/client";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ContentSidebar, type ContentSidebarProps } from "./ContentSidebar";
import { ContentSearchDialog } from "./ContentSearchDialog";
import { findCategoryIdForSlug, type CategoryTree } from "@/lib/contentTree";
import { cn } from "@/lib/utils";

export type { CategoryTree, ContentEntry } from "@/lib/contentTree";

const SIDEBAR_STORAGE_KEY = "content-sidebar";

interface ContentContextValue {
  categories: CategoryTree[];
  isLoading: boolean;
  refreshTree: () => void;
  pageType: string;
  pageId: string;
  pageName: string;
  routeBase: string;
}

const ContentContext = createContext<ContentContextValue>({
  categories: [],
  isLoading: true,
  refreshTree: () => {},
  pageType: "",
  pageId: "",
  pageName: "",
  routeBase: "",
});

export function useContentContext(): ContentContextValue {
  return useContext(ContentContext);
}

interface ContentLayoutProps {
  pageType: string;
  pageName: string;
  pageId: string;
  routeBase: string;
}

export function ContentLayout({ pageType, pageName, pageId, routeBase }: ContentLayoutProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = user?.effective_roles ?? [];
  const { setHasSidebar, setHasNestedLayout } = useLayout();

  const canCreate = hasPermission(pageId, "create", effectiveRoles);
  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canDelete = hasPermission(pageId, "delete", effectiveRoles);

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "closed",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { slug } = useParams({ strict: false }) as { slug?: string };

  useEffect(() => {
    setHasSidebar(true);
    setHasNestedLayout(true);
    return () => {
      setHasSidebar(false);
      setHasNestedLayout(false);
    };
  }, [setHasSidebar, setHasNestedLayout]);

  useEffect(() => {
    setIsLoading(true);
    apiFetch<CategoryTree[]>(`/content/${pageType}/categories`)
      .then(setCategories)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [pageType, refreshKey]);

  useEffect(() => {
    if (!slug) return;
    const owner = findCategoryIdForSlug(categories, slug);
    if (owner) setSelectedCategoryId(owner);
  }, [slug, categories]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "open" : "closed");
  }, [sidebarOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const refreshTree = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const sidebarProps: ContentSidebarProps = {
    categories,
    pageType,
    pageName,
    routeBase,
    canCreate,
    canEdit,
    canDelete,
    selectedCategoryId,
    onSelectCategory: setSelectedCategoryId,
    onOpenSearch: () => setSearchOpen(true),
    onRefresh: refreshTree,
  };

  const contextValue = useMemo(
    () => ({ categories, isLoading, refreshTree, pageType, pageId, pageName, routeBase }),
    [categories, isLoading, refreshTree, pageType, pageId, pageName, routeBase],
  );

  return (
    <ContentContext.Provider value={contextValue}>
      <div className="flex min-h-0 flex-1">
        <div className="relative hidden shrink-0 md:block">
          <aside
            className={cn(
              "flex h-full flex-col overflow-hidden border-border bg-card transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
              sidebarOpen ? "w-80 border-r" : "w-0 border-r-0",
            )}
          >
            <div className="flex w-80 min-h-0 flex-1 flex-col">
              <ContentSidebar {...sidebarProps} />
            </div>
          </aside>
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={sidebarOpen}
            className="absolute top-1/2 right-0 z-30 flex h-12 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ChevronLeft
              className={cn(
                "h-3 w-3 transition-transform duration-300 ease-in-out motion-reduce:transition-none",
                sidebarOpen ? "" : "rotate-180",
              )}
            />
          </button>
        </div>

        <div className="fixed bottom-4 left-4 z-40 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col gap-0 border-border bg-card p-0 pt-4">
              <ContentSidebar {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <div className="flex flex-1 flex-col px-6 pt-6 pb-6">
            <Outlet />
          </div>
        </div>
      </div>

      <ContentSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        categories={categories}
        routeBase={routeBase}
        pageName={pageName}
      />
    </ContentContext.Provider>
  );
}
