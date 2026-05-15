import { createContext, useContext, useState, type ReactNode } from "react";

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
  return (
    <LayoutContext.Provider value={{ hasSidebar, setHasSidebar, hasNestedLayout, setHasNestedLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}
