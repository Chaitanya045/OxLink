export const queryKeys = {
  session: ["session"] as const,
  urls: {
    list: (queryString: string) => ["urls", "list", queryString] as const,
    stats: ["urls", "stats"] as const,
    recent: ["urls", "recent"] as const,
  },
  analytics: {
    snapshot: (shortCode: string, queryString: string) =>
      ["analytics", shortCode, queryString] as const,
  },
};
