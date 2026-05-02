export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  permissions: {
    config: () => ["permissions", "config"] as const,
  },
  leaderboards: {
    pb: () => ["leaderboards", "pb"] as const,
    clog: () => ["leaderboards", "clog"] as const,
    killcounts: () => ["leaderboards", "killcounts"] as const,
    leagues: () => ["leaderboards", "leagues"] as const,
  },
  competitions: {
    list: () => ["competitions"] as const,
    metricDetail: (id: number, metric: string) => ["competitions", id, "metric", metric] as const,
    metricMap: () => ["competitions", "metric-map"] as const,
  },
  parties: {
    list: () => ["parties"] as const,
    chat: (id: string) => ["parties", id, "chat"] as const,
    pingRoles: () => ["parties", "ping-roles"] as const,
  },
  bingo: {
    board: () => ["bingo", "board"] as const,
    teams: () => ["bingo", "teams"] as const,
  },
  members: {
    badges: () => ["members", "badges"] as const,
    feed: () => ["members", "feed"] as const,
    nameChanges: () => ["members", "name-changes"] as const,
    apiKey: () => ["members", "api-key"] as const,
  },
  home: {
    womStats: () => ["home", "wom-stats"] as const,
    clanVault: () => ["home", "clan-vault"] as const,
    achievements: () => ["home", "achievements"] as const,
    competitions: () => ["home", "competitions"] as const,
  },
  assets: {
    list: () => ["assets"] as const,
  },
  content: {
    categories: (pageType: string) => ["content", pageType, "categories"] as const,
    entry: (pageType: string, slug: string) => ["content", pageType, "entry", slug] as const,
  },
  surveys: {
    list: () => ["surveys"] as const,
    applications: () => ["surveys", "applications"] as const,
    detail: (id: string) => ["surveys", id] as const,
    responses: (id: string) => ["surveys", id, "responses"] as const,
  },
  tickets: {
    mine: () => ["tickets", "mine"] as const,
    all: (params: string) => ["tickets", "all", params] as const,
  },
  staff: {
    overview: () => ["staff", "overview"] as const,
    members: (search?: string) => ["staff", "members", search ?? ""] as const,
    badges: () => ["staff", "badges"] as const,
  },
  config: {
    rankMappings: () => ["config", "rank-mappings"] as const,
    ranking: () => ["config", "ranking"] as const,
  },
  ranking: {
    status: () => ["ranking", "status"] as const,
    results: (params: string) => ["ranking", "results", params] as const,
  },
} as const;
