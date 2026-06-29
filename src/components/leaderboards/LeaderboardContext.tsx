import { createContext, useContext, useState } from "react";

export type Density = "comfortable" | "compact";

interface LeaderboardContextValue {
  density: Density;
  setDensity: (d: Density) => void;
  compact: boolean;
}

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);

export function useLeaderboardContext(): LeaderboardContextValue {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error("useLeaderboardContext used outside LeaderboardProvider");
  return ctx;
}

export function LeaderboardProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [density, setDensity] = useState<Density>("comfortable");
  return (
    <LeaderboardContext.Provider value={{ density, setDensity, compact: density === "compact" }}>
      {children}
    </LeaderboardContext.Provider>
  );
}
