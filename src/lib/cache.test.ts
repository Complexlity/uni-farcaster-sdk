import { beforeEach, describe, expect, test } from "vitest";
import { Cache } from "./cache";
import { DEFAULTS } from "./constants";
import type { Cast, User } from "./types";
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

  test("should set and get user data by fid", () => {
    const user: User = dummyUser;

    cache.set("fid", [user, user], [[user.fid, user.fid], dummyViewerFid]);

    const cachedUserByFid = cache.get("fid", [
      [user.fid, user.fid],
      dummyViewerFid,
    ]);
    expect(cachedUserByFid).toEqual([user, user]);
  });
  test("should set and get user data by username", () => {
    const user: User = dummyUser;

    cache.set("username", user, [user.username, dummyViewerFid]);

    const cachedUserByUsername = cache.get("username", [
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
    const nonExistentUser = cache.get("username", ["nonexistent"]);
    expect(nonExistentUser).toBeNull();
    const nonExistentUser2 = cache.get("fid", [[124], 213144]);
    expect(nonExistentUser2).toBeNull();

    const nonExistentCast = cache.get("cast", ["nonexistent"]);
    expect(nonExistentCast).toBeNull();
  });

  test("should throw an error for invalid cache type", () => {
    // @ts-expect-error Testing invalid type
    expect(() => cache.get("invalid", [])).toThrow("Invalid cache type");

    // @ts-expect-error Testing invalid type
    expect(() => cache.set("invalid", {}, [])).toThrow("Invalid cache type");
  });
});

describe("cache with custom TTL", () => {
  test("should use custom TTL when provided", () => {
    const customTtl = 1000;
    const customCache = new Cache({ ttl: customTtl });

    expect(customCache.ttl).toBe(customTtl);
  });

  test("should use default TTL when not provided", () => {
    const defaultTtl = DEFAULTS.cacheTtl;
    const defaultCache = new Cache();

    expect(defaultCache.ttl).toBe(defaultTtl);
  });

  test("should return null when invalidated", () => {
    const cache = new Cache({ ttl: 0 });
    const user: User = dummyUser;

    cache.set("username", user, [user.username, dummyViewerFid]);

    const cachedUserByFid = cache.get("username", [
      user.username,
      dummyViewerFid,
    ]);
    expect(cachedUserByFid).toBeNull();

    const cachedUserByUsername = cache.get("username", [
      user.username,
      dummyViewerFid,
    ]);
    expect(cachedUserByUsername).toBeNull();
  });

  test("should return null or result depending on ttl", async () => {
    const cacheTtl = 100;
    const cache = new Cache({ ttl: cacheTtl });
    const user: User = dummyUser;

    cache.set("fid", [user, user], [[user.fid, user.fid], dummyViewerFid]);

    const cachedUserByFid = cache.get("fid", [
      [user.fid, user.fid],
      dummyViewerFid,
    ]);
    expect(cachedUserByFid).toEqual([user, user]);

    cache.set("username", user, [user.username, dummyViewerFid]);
    const cachedUserByUsername = cache.get("username", [
      user.username,
      dummyViewerFid,
    ]);
    expect(cachedUserByUsername).toEqual(user);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, cacheTtl + 10));

    const cachedUserByFid2 = cache.get("fid", [
      [user.fid, user.fid],
      dummyViewerFid,
    ]);
    expect(cachedUserByFid2).toBeNull();

    const cachedUserByUsername2 = cache.get("username", [
      user.username,
      dummyViewerFid,
    ]);
    expect(cachedUserByUsername2).toBeNull();
  });
});
