import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ControlPanelContextValue {
  open: boolean;
  pageId: string | null;
  openPanel: (pageId?: string) => void;
  closePanel: () => void;
}

const ControlPanelContext = createContext<ControlPanelContextValue>({
  open: false,
  pageId: null,
  openPanel: () => {},
  closePanel: () => {},
});

export function ControlPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  const value = useMemo<ControlPanelContextValue>(
    () => ({
      open,
      pageId,
      openPanel: (id) => {
        setPageId(id ?? null);
        setOpen(true);
      },
      closePanel: () => setOpen(false),
    }),
    [open, pageId],
  );

  return <ControlPanelContext.Provider value={value}>{children}</ControlPanelContext.Provider>;
}

export function useControlPanel(): ControlPanelContextValue {
  return useContext(ControlPanelContext);
}
