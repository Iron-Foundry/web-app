import { createContext, useContext, useState, type ReactNode } from "react";

interface LayoutCtx {
  hasSidebar: boolean;
  setHasSidebar: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutCtx>({
  hasSidebar: false,
  setHasSidebar: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [hasSidebar, setHasSidebar] = useState(false);
  return (
    <LayoutContext.Provider value={{ hasSidebar, setHasSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
}
