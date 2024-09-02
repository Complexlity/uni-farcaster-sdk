export const DEFAULTS = {
  neynarApiKey: "NEYNAR_API_DOCS",
  fid: 213144,
  //Complexlity fid
  cacheTtl: 60 * 60 * 1000,
  //Default cache time is 1 hour
  retries: 0,
  //Queries don't retry by default
} as const;
