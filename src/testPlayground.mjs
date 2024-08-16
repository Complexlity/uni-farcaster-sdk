import uniFarcasterSdk, { Cache } from "../dist/index.mjs";

const sdk = new uniFarcasterSdk({
  neynarApiKey: "NEYNAR_API_DOCS",
  airstackApiKey: "AIRSTACK_API_DOCS",
  activeService: "neynar",
  debug: true,
});

// sdk.getActiveService();
// const {data: user, error} = await sdk.getUserByUsername('noseals');
// const { data: user2, error2 } = await sdk.getUserByUsername('noseals');
// sdk.setActiveService('neynar');
// const { data: user3, error3 } = await sdk.getUserByUsername('noseals');
// const { data: user4, error4 } = await sdk.getUserByUsername(user3.fid);

const { data: cast, error: errorCast } = await sdk.getCastByHash(
  "0xbed8c16b624d656b3471746f0d73ab9d8ec1fb95"
);
sdk.setActiveService("airstack");
const { data: cast1, error: errorCast1 } = await sdk.getCastByUrl(
  cast.url
);
const { data: cast2, error: errorCast2 } = await sdk.getCastByHash(
  cast.hash
);

