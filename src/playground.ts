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

// class MyClass {
//   private name: "neynar" | "airstack";

//   constructor(name: "neynar" | "airstack") {
//     this.name = name;
//   }

//   private neynarMethod(endpoint: string): void {
//     console.log(`Neynar endpoint: ${endpoint}`);
//   }

//   private airstackMethod(query: string): void {
//     console.log(`Airstack query: ${query}`);
//   }

//   public getInstance() {
//     if (this.name === "neynar") {
//       return {
//         neynar: this.neynarMethod.bind(this),
//       } as T extends "neynar" ? NeynarInstance : never;
//     } else if (this.name === "airstack") {
//       return {
//         airstack: this.airstackMethod.bind(this),
//       } as T extends "airstack" ? AirstackInstance : never;
//     }
//     throw new Error("Invalid service name");
//   }
// }

// const T = "neynar";
// const myClass = new MyClass(T);
// myClass.getInstance<typeof T>().neynar("");

type Config =
  | {
      a: "a";
    }
  | {
      b: "b";
    }
  | {
      a: "a";
      b: "b";
    };

function evaluateConfig(config: Config) {
  if ("a" in config || "b" in config) {
    //@ts-expect-error: Ignore. I do many other logic here
    return { a: config.a, b: config.b };
  }
  throw new Error("One of a or b must exist in config");
}

class DummyClass {
  private a: string | undefined;
  private b: string | undefined;
  constructor(config: Config) {
    //See function at line 12
    const { a, b } = evaluateConfig(config);
    if (a) this.a = a;
    if (b) this.b = b;
    //One of this.a or this.b must exist. Both can also exist
  }

  private aLogic() {
    console.log("I am some custom a logic");
  }
  private bLogic() {
    console.log("I am some custom b logic");
  }

  public custom() {
    let customFunctions;
    //One of a or b must actual exists and throws in evaulateConfig
    if (this.a && this.b) {
      customFunctions = {
        a: this.aLogic,
        b: this.bLogic,
      };
    } else if (this.a) {
      customFunctions = {
        a: this.aLogic,
      };
    } else if (this.b) {
      customFunctions = {
        b: this.bLogic,
      };
    } else throw new Error("One of this.a or this.b must exist");
    return customFunctions;
  }
}

const myClass = new DummyClass({ a: "a", b: "b" });

//I want typescript to know that a and b exists base on my arguments passed into DummyClass
//Both should not error
myClass.custom().a?.();
myClass.custom().b?.();

const myClass2 = new DummyClass({ b: "b" });

//I want typescript to know that only b exist
//This should error
myClass2.custom().a?.();
//This should not error
myClass2.custom().b?.();

const myClass3 = new DummyClass({ a: "a" });

//I want typescript to know that a exists
//This should not error
myClass3.custom().a?.();
//This should error
myClass3.custom().b?.();