# UniFarcaster SDK

This is an SDK that combines neynar, airstack to provide a single API without needing to know the underlying apis of both.
## Installation

```bash
npm install uni-farcaster-sdk
```

## Usage

```js
import uniFarcasterSdk from 'uni-farcaster-sdk'

// Neynar
const sdkInstance = new uniFarcasterSdk({
	neynarApiKey: 'your-neynar-api-key',
	activeService: 'neynar'//Optional. It's implied from the api key you provide
})
// Airstack
const sdkInstance = new uniFarcasterSdk({
	airstackApiKey: 'your-airstack-api-key',
	activeService: 'airstack' //Optional. It's implied from the api key you provide
})

// Invalid active service is ignored
const sdkInstance = new uniFarcasterSdk({
	airstackApiKey: 'your-airstack-api-key',
	activeService: 'neynar' //Automatically set to airstack since only airstack api key is provided
})

  //Both
  const sdkInstance = new uniFarcasterSdk({
    neynarApiKey: 'your-neynar-api-key',
    airstackApiKey: 'your-airstack-api-key',
    //You should specify if you prefer neynar or airstack else it randomly choses one of them
    activeService: 'airstack',
  })

//Debug Mode
const sdkInstance = new uniFarcasterSdk({
	...otherConfigOptions
  debug: true, //Logs every query on the console with the active service used for it,
  logLevel: "info"| "warn"| "error"| "success"
  //Optional and only used when debug is true.
  // By default, all query is logged but setting the log level will only log queries with the specified level
})

//Get Active Service
sdkInstance.getActiveService() //airstack

//Set Active Service
sdkInstance.setActiveService('neynar')
sdkInstance.getActiveService() //neynar

//Get User By Fid
const userFid = 3
const viewerFid = 4
await sdkInstance.getUserByFid(3, 4)
//Viewer Fid is optional and defaults to 213144

//Get User By Username
const userName = 'ds8'
await sdkInstance.getUserByUsername(userName)
//Viewer Fid is optional and defaults to 213144

//Get Cast By Url
await sdkInstance.getCastByUrl(castUrl, viewerFid)

//Get Cast By Hash
await sdkInstance.getCastByHash(castHash, viewerFid)
```

> [!IMPORTANT]
> Getting by username doesn't return viewer context when using airstack instance so use getUserByFid when you always need viewerContext.



## Return Types
```ts
type User = {
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

type Cast = {
  author: UserWithOptionalViewerContext;
  userReactions: {
    likes: number;
    recasts: number;
  };
  viewerContext: {
    liked: boolean;
    recasted: boolean;
  };
  text: string;
  embeds: any[];
  channel: string | null;
};
```

## Error Handling

By default, invalid configurations will throw an error.
All queries don't throw errors but return an object

```ts
{data: PossibleReturnedValue | null, error: any | null}
```
Check if error is not null to knowif there was an error and handle it accordingly.

## TODO
- Add an optional `retry` config to all queries and the option to switch service if there's an error
i.e If the current active service is airstack and the query fails, it will try to use neynar`

