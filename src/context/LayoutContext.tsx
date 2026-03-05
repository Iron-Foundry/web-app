import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type NavLayout = "top" | "sidebar" | "hybrid";

interface LayoutContextType {
  navLayout: NavLayout;
  setNavLayout: (layout: NavLayout) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [navLayout, setNavLayout] = useState<NavLayout>("top");

  return (
    <LayoutContext.Provider value={{ navLayout, setNavLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}