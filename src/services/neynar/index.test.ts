import nock, { cleanAll } from "nock";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { neynarService } from ".";
import { DEFAULTS } from "../../lib/constants";
import { runBasicTests } from "../../lib/utils";
import { NEYNAR_DEFAULTS } from "./constants";
import { NeynarV1User } from "./types";

const service = new neynarService("test-api-key");

runBasicTests(service);

test("it should error if api key is not provided", async () => {
  expect(() => new neynarService("")).toThrowError();
});

describe("getUserByFid", () => {
  const apiKey = "test-api-key";
  let service: neynarService;

  beforeEach(() => {
    cleanAll();
    service = new neynarService(apiKey);
  });

  afterEach(() => {
    cleanAll();
  });

  test("returns user data for valid FID", async () => {
    const fid = 123;
    const viewerFid = DEFAULTS.fid;

    const mockResponse = {
      users: [
        {
          fid: 123,
          username: "testuser",
          display_name: "Test User",
          pfp_url: "https://example.com/pfp.jpg",
          profile: { bio: { text: "Test bio" } },
          follower_count: 100,
          following_count: 50,
          verified_addresses: { eth_addresses: ["0x123"], sol_addresses: [] },
          custody_address: "0x456",
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.userByFidUrl)
      .query({ fids: `${fid}`, viewer_fid: `${viewerFid}` })
      .reply(200, mockResponse);

    const result = await service.getUserByFid(fid);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      fid: 123,
      username: "testuser",
      displayName: "Test User",
      pfpUrl: "https://example.com/pfp.jpg",
      bio: "Test bio",
      followerCount: 100,
      followingCount: 50,
      ethAddresses: ["0x123", "0x456"],
      solAddresses: [],
      viewerContext: { following: false, followedBy: false },
    });
  });
  test("handles API errors", async () => {
    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.userByFidUrl)
      .query(true)
      .reply(500, { error: { message: "Internal server error" } });

    const result = await service.getUserByFid(123);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "Internal server error" });
  });
});
describe("getUserByUsername", () => {
  const apiKey = "test-api-key";
  let service: neynarService;

  beforeEach(() => {
    cleanAll();
    service = new neynarService(apiKey);
  });

  afterEach(() => {
    cleanAll();
  });

  test("returns user data for valid username", async () => {
    const username = "testuser";
    const viewerFid = DEFAULTS.fid;

    const mockResponse: { result: { user: NeynarV1User } } = {
      result: {
        user: {
          fid: 123,
          username: "testuser",
          displayName: "Test User",
          pfp: {
            url: "https://example.com/pfp.jpg",
          },
          profile: {
            bio: {
              text: "Test bio",
            },
          },
          followerCount: 100,
          followingCount: 50,
          verifications: ["0x123"],
          viewerContext: {
            following: false,
            followedBy: false,
          },
          custodyAddress: "0x456",
          verifiedAddresses: {
            eth_addresses: ["0x123"],
            sol_addresses: [],
          },
        },
      },
    };

    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.userByUsernameUrl)
      .query({ username, viewerFid: `${viewerFid}` })
      .reply(200, mockResponse);

    const result = await service.getUserByUsername(username, viewerFid);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      fid: 123,
      username: "testuser",
      displayName: "Test User",
      pfpUrl: "https://example.com/pfp.jpg",
      bio: "Test bio",
      followerCount: 100,
      followingCount: 50,
      ethAddresses: ["0x123", "0x456"],
      solAddresses: [],
      viewerContext: { following: false, followedBy: false },
    });
  });

  test("handles getUserByUsername API errors", async () => {
    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.userByUsernameUrl)
      .query(true)
      .reply(404, { error: { message: "User not found" } });

    const result = await service.getUserByUsername("nonexistentuser");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "User not found" });
  });
});

describe("getCastByHash", () => {
  const apiKey = "test-api-key";
  let service: neynarService;

  beforeEach(() => {
    cleanAll();
    service = new neynarService(apiKey);
  });

  afterEach(() => {
    cleanAll();
  });

  test("returns cast data for valid hash", async () => {
    const hash = "test-hash";
    const viewerFid = DEFAULTS.fid;

    const mockResponse = {
      cast: {
        hash: "test-hash",
        author: {
          fid: 123,
          username: "testuser",
          display_name: "Test User",
          pfp_url: "https://example.com/pfp.jpg",
          profile: { bio: { text: "Test bio" } },
          follower_count: 100,
          following_count: 50,
          verified_addresses: { eth_addresses: ["0x123"], sol_addresses: [] },
          custody_address: "0x456",
          viewer_context: { following: false, followed_by: false },
        },
        text: "Test cast",
        reactions: { likes_count: 10, recasts_count: 5 },
        viewer_context: { liked: false, recasted: false },
        embeds: [],
      },
    };

    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.castUrl)
      .query({ type: "hash", identifier: hash, viewer_fid: `${viewerFid}` })
      .reply(200, mockResponse);

    const result = await service.getCastByHash(hash);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      author: {
        fid: 123,
        username: "testuser",
        displayName: "Test User",
        pfpUrl: "https://example.com/pfp.jpg",
        bio: "Test bio",
        followerCount: 100,
        followingCount: 50,
        ethAddresses: ["0x123", "0x456"],
        solAddresses: [],
        viewerContext: { following: false, followedBy: false },
      },
      hash: "test-hash",
      url: "https://warpcast.com/testuser/test-hash",
      userReactions: { likes: 10, recasts: 5 },
      viewerContext: { liked: false, recasted: false },
      text: "Test cast",
      embeds: [],
      channel: null,
    });
  });

  test("handles API errors", async () => {
    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get(NEYNAR_DEFAULTS.castUrl)
      .query(true)
      .reply(400, { error: { message: "Invalid hash" } });

    const result = await service.getCastByHash("invalidhash");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "Invalid hash" });
  });
});
describe("getCastByUrl", () => {
  const apiKey = "test-api-key";
  let service: neynarService;

  beforeEach(() => {
    cleanAll();
    service = new neynarService(apiKey);
  });

  afterEach(() => {
    cleanAll();
  });

  test("returns cast data for valid URL", async () => {
    const url = "https://warpcast.com/testuser/0123456789";
    const viewerFid = DEFAULTS.fid;

    const mockResponse = {
      cast: {
        hash: "0123456789abcdef",
        author: {
          fid: 123,
          username: "testuser",
          display_name: "Test User",
          pfp_url: "https://example.com/pfp.jpg",
          profile: { bio: { text: "Test bio" } },
          follower_count: 100,
          following_count: 50,
          verified_addresses: { eth_addresses: ["0x123"], sol_addresses: [] },
          custody_address: "0x456",
          viewer_context: { following: false, followed_by: false },
        },
        text: "Test cast",
        reactions: { likes_count: 10, recasts_count: 5 },
        viewer_context: { liked: false, recasted: false },
        embeds: [],
      },
    };

    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get("/v2/farcaster/cast")
      .query({ type: "url", identifier: url, viewer_fid: `${viewerFid}` })
      .reply(200, mockResponse);

    const result = await service.getCastByUrl(url);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      author: {
        fid: 123,
        username: "testuser",
        displayName: "Test User",
        pfpUrl: "https://example.com/pfp.jpg",
        bio: "Test bio",
        followerCount: 100,
        followingCount: 50,
        ethAddresses: ["0x123", "0x456"],
        solAddresses: [],
        viewerContext: { following: false, followedBy: false },
      },
      hash: "0123456789abcdef",
      url: "https://warpcast.com/testuser/0123456789",
      userReactions: { likes: 10, recasts: 5 },
      viewerContext: { liked: false, recasted: false },
      text: "Test cast",
      embeds: [],
      channel: null,
    });
  });

  test("handles API errors", async () => {
    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get("/v2/farcaster/cast")
      .query(true)
      .reply(403, { error: { message: "Unauthorized access" } });

    const result = await service.getCastByUrl("https://example.com/invalid");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "Unauthorized access" });
  });
});

describe("Non-axios errors", () => {
  test("handles non-Axios errors", async () => {
    nock(NEYNAR_DEFAULTS.baseApiUrl)
      .get("/v2/farcaster/user/bulk")
      .query(true)
      .replyWithError("Network error");

    const result = await service.getUserByFid(123);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: "Something went wrong. Please try again",
    });
  });
});
