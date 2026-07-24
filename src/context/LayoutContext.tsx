import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface LayoutCtx {
  hasSidebar: boolean;
  setHasSidebar: (v: boolean) => void;
  hasNestedLayout: boolean;
  setHasNestedLayout: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutCtx>({
  hasSidebar: false,
  setHasSidebar: () => {},
  hasNestedLayout: false,
  setHasNestedLayout: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [hasSidebar, setHasSidebar] = useState(false);
  const [hasNestedLayout, setHasNestedLayout] = useState(false);
  const value = useMemo<LayoutCtx>(
    () => ({ hasSidebar, setHasSidebar, hasNestedLayout, setHasNestedLayout }),
    [hasSidebar, hasNestedLayout],
  );
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
