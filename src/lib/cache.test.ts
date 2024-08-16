import { describe, test, expect, beforeEach } from "vitest";
import { Cache } from "./cache";
import { User, Cast } from "./types";
const dummyUser: User = {
  fid: 123,
  ethAddresses: [],
  solAddresses: [],
  username: "testuser",
  displayName: "Test User",
  bio: "This is a test user",
  pfpUrl: "https://example.com/pfp.png",
  followerCount: 100,
  followingCount: 50,
  powerBadge: true,
  viewerContext: {
    following: true,
    followedBy: true,
  },
};
const dummyViewerFid = 123;

const dummyCast: Cast = {
  author: dummyUser,
  hash: "abc123",
  url: "https://example.com/cast/abc123",
  userReactions: {
    likes: 10,
    recasts: 5,
  },
  viewerContext: {
    liked: true,
    recasted: false,
  },
  text: "This is a test cast",
  embeds: [],
  channel: "test_channel",
};

describe("cache", () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  test("should set and get user data", () => {
    const user: User = dummyUser;

    cache.set("user", user, [dummyViewerFid]);

    const cachedUserByFid = cache.get("user", [user.fid, dummyViewerFid]);
    expect(cachedUserByFid).toEqual(user);

    const cachedUserByUsername = cache.get("user", [
      user.username,
      dummyViewerFid,
    ]);
    expect(cachedUserByUsername).toEqual(user);
  });

  test("should set and get cast data", () => {
    const cast: Cast = dummyCast;
    cache.set("cast", cast, [dummyViewerFid]);

    const cachedCastByHash = cache.get("cast", [cast.hash, dummyViewerFid]);
    expect(cachedCastByHash).toEqual(cast);

    const cachedCastByUrl = cache.get("cast", [cast.url, dummyViewerFid]);
    expect(cachedCastByUrl).toEqual(cast);
  });

  test("should return null for non-existent data", () => {
    const nonExistentUser = cache.get("user", ["nonexistent"]);
    expect(nonExistentUser).toBeNull();

    const nonExistentCast = cache.get("cast", ["nonexistent"]);
    expect(nonExistentCast).toBeNull();
  });

  test("should throw an error for invalid cache type", () => {
    // @ts-expect-error Testing invalid type
    expect(() => cache.get("invalid", [])).toThrow("Invalid cache type");

    // @ts-expect-error Testing invalid type
    expect(() => cache.set("invalid", {}, [])).toThrow("Invalid cache type");
  });

  test("should use custom TTL when provided", () => {
    const customTtl = 1000; // 1 second
    const customCache = new Cache({ ttl: customTtl });

    expect(customCache.ttl).toBe(customTtl);
  });
});
