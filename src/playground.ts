// const uniFarcasterSdk: any = {};

// const sdk = new uniFarcasterSdk({
//   hubUrl: "string | hasDefaultValue",
//   neynarApiKey: "NEYNAR_API_KEY",
//   airstackApiKey: "AIRSTACK_API_KEY",
//   activeService: "airstack",
// });

// const user: User = sdk.getUserByUsername("complexlity", 213144);
// const user2: User = sdk.getUserByFid(11244, 213144);
// const cast: Cast = sdk.getCastByHash("0xa0bc828", 213144);
// const cast2: Cast = sdk.getCastByUrl("https://warpcast.com/0xa38dj", 213144);

//  type User = {
//   fid: number;
//   ethAddresses: string[];
//   solAddresses: string[];
//   username: string;
//   displayName: string;
//   bio: string;
//   pfpUrl: string;
//   followerCount: number;
//   followingCount: number;
//   powerBadge?: boolean;
//   viewerContext: {
//     following: boolean;
//     followedBy: boolean;
//   };
// };

//  type Cast = {
//   author: Omit<User, "viewerContext">;
//   userReactions: {
//     likes: number;
//     recasts: number;
//   };
//   viewerContext: {
//     liked: boolean;
//     recasted: boolean;
//   };
//   text: string;
//   embeds: any[];
//   channel: string | null;
// };

// // Optional: Expose neynar and airstack for direct query when extra infor needed
// const endpoint = "/user?limit=2";
// const query = `SOME_GRAPHQL_QUERY`;
// sdk.neynar(endpoint);
// sdk.airstack(query);

type NeynarInstance = {
  neynar: (endpoint: string) => void;
};

type AirstackInstance = {
  airstack: (query: string) => void;
};

class MyClass {
  private name: "neynar" | "airstack";

  constructor(name: "neynar" | "airstack") {
    this.name = name;
  }

  private neynarMethod(endpoint: string): void {
    console.log(`Neynar endpoint: ${endpoint}`);
  }

  private airstackMethod(query: string): void {
    console.log(`Airstack query: ${query}`);
  }

  public getInstance<T = typeof this.name>() {
    if (this.name === "neynar") {
      return {
        neynar: this.neynarMethod.bind(this),
      } as T extends "neynar" ? NeynarInstance : never
    } else if(this.name === "airstack") {
      return {
        airstack: this.airstackMethod.bind(this),
      } as T extends "airstack" ? AirstackInstance : never;
    }
    throw new Error("Invalid service name");
  }
}

const T = 'neynar'
const myClass = new MyClass(T);
myClass.getInstance<typeof T>().neynar('')
