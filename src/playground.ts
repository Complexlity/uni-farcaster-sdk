// const uniFarcasterSdk: any = {};

import uniFarcasterSdk from ".";

const sdk = new uniFarcasterSdk({
  hubUrl: "string | hasDefaultValue",
  neynarApiKey: "NEYNAR_API_DOCS",
  airstackApiKey: "string | undefined",
  activeService: "neynar",
});

// const user = await sdk.getUserByFid(11244, 213144);
// // console.log(user);
const cast = await sdk.getCastByUrl(
  "https://warpcast.com/timdaub.eth/0x9d6f3c51",
  213144
);
console.log(cast);
// console.log(user);
// const user2: User = sdk.getUserByUsername("complexlity", 213144);
// const cast: Cast = sdk.getCastByHash("0xa0bc828", 213144);
// const cast2: Cast = sdk.getCastByUrl("https://warpcast.com/0xa38dj", 213144);

export type User = {
  fid: number;
  ethAddresses: string[];
  solAddresses: string[];
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  viewerContext: {
    following: boolean;
    followedBy: boolean;
  };
};

export type Cast = {
  author: User;
  userReactions: {
    likes: number;
    recasts: number;
  };
  viewerContext: {
    liked: boolean;
    recasted: boolean;
  };
};

//Optional: Expose neynar and airstack for direct query when extra infor needed
// const endpoint = "/user?limit=2";
// const query = `SOME_GRAPHQL_QUERY`;
// sdk.neynar(endpoint);
// sdk.airstack(query);
