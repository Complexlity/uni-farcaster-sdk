import uniFarcasterSdk from "@";

const sdk = new uniFarcasterSdk({
  neynarApiKey: "NEYNAR_API_DOCS",
  airstackApiKey: "AIRSTACK_API_DOCS",
  activeService: "neynar",
	debug: true,
	logLevel: "warning"
});

sdk.getActiveService();
sdk.setActiveService("airstack");
const user = await sdk.getUserByFid(213144);
// sdk.setActiveService("neynar");
const user2 = await sdk.getUserByUsername("v")