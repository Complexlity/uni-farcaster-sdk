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
const sdkInstance = uniFarcasterSdk({
	neynarApiKey: 'your-neynar-api-key',
	activeService: 'neynar'//Optional. It's implied from the api key you provide
})
// Airstack
const sdkInstance = uniFarcasterSdk({
	airstackApiKey: 'your-airstack-api-key',
	activeService: 'airstack' //Optional. It's implied from the api key you provide
})

//Both
const sdkInstance = uniFarcasterSdk({
	neynarApiKey: 'your-neynar-api-key',
	airstackApiKey: 'your-airstack-api-key',
	//You should specify if you prefer neynar or airstack else is randomly chose one of them
	activeService: 'airstack',
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

//Getting by username doesn't return viewer context when using airstack instance so use getUserByFid when you always need viewerContext

//Get Cast By Url
await sdkInstance.getCastByUrl(castUrl, viewerFid)

//Get Cast By Hash
await sdkInstance.getCastByHash(castHash, viewerFid)
```




