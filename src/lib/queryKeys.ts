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
    overtime: (id: number, metric: string, limit?: number) => ["competitions", id, "overtime", metric, limit] as const,
  },
  parties: {
    list: () => ["parties"] as const,
    chat: (id: string) => ["parties", id, "chat"] as const,
    notificationCategories: () => ["parties", "notification-categories"] as const,
    notificationPreferences: () => ["parties", "notification-preferences"] as const,
  },
  bingo: {
    board: () => ["bingo", "board"] as const,
    teams: () => ["bingo", "teams"] as const,
  },
  members: {
    badges: () => ["members", "badges"] as const,
    feed: () => ["members", "feed"] as const,
    stats: () => ["members", "stats"] as const,
    rankings: () => ["members", "rankings"] as const,
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
    panel: () => ["config", "panel"] as const,
  },
  ranking: {
    status: () => ["ranking", "status"] as const,
    results: (params: string) => ["ranking", "results", params] as const,
    stats: () => ["ranking", "stats"] as const,
  },
  services: {
    status: () => ["services", "status"] as const,
    history: (service: string, module: string, range: string) =>
      ["services", "history", service, module, range] as const,
    uptime: (days: number) => ["services", "uptime", days] as const,
    bandwidth: (service: string, module: string) => ["services", "bandwidth", service, module] as const,
    womRateLimit: () => ["services", "wom-rate-limit"] as const,
    toggles: () => ["services", "toggles"] as const,
  },
  compSchedule: {
    list: () => ["comp-schedule"] as const,
    detail: (id: number) => ["comp-schedule", id] as const,
    runs: (id: number, status?: string) => ["comp-schedule", id, "runs", status ?? ""] as const,
  },
  frenzy: {
    active: () => ["frenzy", "active"] as const,
    team: (slug: string) => ["frenzy", "active", "team", slug] as const,
    teamHistory: (slug: string) => ["frenzy", "active", "team", slug, "history"] as const,
    eventHistory: () => ["frenzy", "active", "history"] as const,
    leaderboards: () => ["frenzy", "leaderboards"] as const,
    osrsItems: (q: string) => ["frenzy", "osrs", "items", q] as const,
    osrsBosses: () => ["frenzy", "osrs", "bosses"] as const,
    osrsActivities: () => ["frenzy", "osrs", "activities"] as const,
    templates: () => ["frenzy", "templates"] as const,
    template: (id: number) => ["frenzy", "template", id] as const,
    templateVersions: (id: number) => ["frenzy", "template", id, "versions"] as const,
    templateVersion: (id: number, vid: number) => ["frenzy", "template", id, "version", vid] as const,
    events: () => ["frenzy", "events"] as const,
    event: (id: number) => ["frenzy", "event", id] as const,
    submissions: (eventId: number, params?: string) => ["frenzy", "submissions", eventId, params ?? ""] as const,
  },
} as const;
