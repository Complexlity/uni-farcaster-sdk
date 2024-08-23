import { beforeEach, describe, expect, test, vi } from "vitest";
import { airstackService } from ".";
import { runBasicTests } from "../../lib/utils";
import { AirstackCastQueryResult, AirstackUserQueryResult } from "./types";
import { fetchQuery } from "./utils";

vi.mock("./utils");
const service = new airstackService("test-api-key");

runBasicTests(service);

describe("main", () => {
  test("it should error if api key is not provided", async () => {
    expect(() => new airstackService("")).toThrowError();
  });

  test("it should error if customQuery function is missing", async () => {
    expect(service.customQuery).not.toBeUndefined();
  });
});

describe("airstackService", () => {
  const apiKey = "test-api-key";
  let service: airstackService;

  beforeEach(() => {
    service = new airstackService(apiKey);
    vi.clearAllMocks();
  });

  describe("getUserByFid", () => {
    test("returns user data for valid FID", async () => {
      const mockResult: AirstackUserQueryResult = {
        Socials: {
          Social: [
            {
              userId: "123",
              profileName: "testuser",
              profileDisplayName: "Test User",
              profileImage: "https://example.com/pfp.jpg",
              followerCount: 100,
              followingCount: 50,
              isFarcasterPowerUser: true,
              profileBio: "Test bio",
              userAddress: "0x123",
              connectedAddresses: [
                { address: "0x456", blockchain: "ethereum" },
                { address: "sol123", blockchain: "solana" },
              ],
            },
          ],
        },
        Following: { Following: null },
        Followedby: { Following: null },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getUserByFid(123, 456);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        fid: 123,
        username: "testuser",
        displayName: "Test User",
        pfpUrl: "https://example.com/pfp.jpg",
        followerCount: 100,
        followingCount: 50,
        powerBadge: true,
        bio: "Test bio",
        ethAddresses: ["0x456", "0x123"],
        solAddresses: ["sol123"],
        viewerContext: { following: false, followedBy: false },
      });
    });

    test("handles API errors", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "API Error" },
      });

      const result = await service.getUserByFid(123, 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "API Error" });
    });
  });

  describe("getUserByUsername", () => {
    test("returns user data for valid username", async () => {
      const mockResult = {
        Socials: {
          Social: [
            {
              userId: "123",
              profileName: "testuser",
              profileDisplayName: "Test User",
              profileImage: "https://example.com/pfp.jpg",
              followerCount: 100,
              followingCount: 50,
              isFarcasterPowerUser: true,
              profileBio: "Test bio",
              userAddress: "0x123",
              connectedAddresses: [
                { address: "0x456", blockchain: "ethereum" },
                { address: "sol123", blockchain: "solana" },
              ],
            },
          ],
        },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getUserByUsername("testuser", 456);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        fid: 123,
        username: "testuser",
        displayName: "Test User",
        pfpUrl: "https://example.com/pfp.jpg",
        followerCount: 100,
        followingCount: 50,
        powerBadge: true,
        bio: "Test bio",
        ethAddresses: ["0x456", "0x123"],
        solAddresses: ["sol123"],
      });
    });

    test("handles API errors", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "User not found" },
      });

      const result = await service.getUserByUsername("nonexistent", 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "User not found" });
    });
  });

  describe("getCastByHash", () => {
    test("returns cast data for valid hash", async () => {
      const mockResult: AirstackCastQueryResult = {
        FarcasterCasts: {
          Cast: [
            {
              hash: "test-hash",
              url: "https://warpcast.com/testuser/0123456789",
              text: "Test cast",
              numberOfLikes: 10,
              numberOfRecasts: 5,
              embeds: [],
              channel: { name: "test-channel" },
              castedBy: {
                userId: "123",
                profileName: "testuser",
                profileDisplayName: "Test User",
                profileImage: "https://example.com/pfp.jpg",
                followerCount: 100,
                followingCount: 50,
                isFarcasterPowerUser: true,
                profileBio: "Test bio",
                userAddress: "0x123",
                connectedAddresses: [],
              },
            },
          ],
        },
        LikedBy: { Reaction: null },
        RecastedBy: { Reaction: null },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getCastByHash("test-hash", 456);

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        hash: "test-hash",
        url: "https://warpcast.com/testuser/0123456789",
        text: "Test cast",
        userReactions: { likes: 10, recasts: 5 },
        viewerContext: { liked: false, recasted: false },
        channel: "test-channel",
      });
    });

    test("handles API errors", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "Cast not found" },
      });

      const result = await service.getCastByHash("nonexistent", 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Cast not found" });
    });
  });

  describe("getCastByUrl", () => {
    test("returns cast data for valid URL", async () => {
      const mockResult: AirstackCastQueryResult = {
        FarcasterCasts: {
          Cast: [
            {
              hash: "test-hash",
              url: "https://warpcast.com/testuser/0123456789",
              text: "Test cast",
              numberOfLikes: 10,
              numberOfRecasts: 5,
              embeds: [],
              channel: { name: "test-channel" },
              castedBy: {
                userId: "123",
                profileName: "testuser",
                profileDisplayName: "Test User",
                profileImage: "https://example.com/pfp.jpg",
                followerCount: 100,
                followingCount: 50,
                isFarcasterPowerUser: true,
                profileBio: "Test bio",
                userAddress: "0x123",
                connectedAddresses: [],
              },
            },
          ],
        },
        LikedBy: { Reaction: null },
        RecastedBy: { Reaction: null },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getCastByUrl(
        "https://warpcast.com/testuser/0123456789",
        456,
      );

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        hash: "test-hash",
        url: "https://warpcast.com/testuser/0123456789",
        text: "Test cast",
        userReactions: { likes: 10, recasts: 5 },
        viewerContext: { liked: false, recasted: false },
        channel: "test-channel",
      });
    });

    test("handles API errors", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "Invalid URL" },
      });

      const result = await service.getCastByUrl("https://invalid-url.com", 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Invalid URL" });
    });
  });

  describe("customQuery", () => {
    test("executes a custom query successfully", async () => {
      const mockResult = { customData: "test data" };
      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.customQuery("custom query", {
        var1: "value1",
      });

      expect(result).toEqual({ data: mockResult, error: null });
      expect(fetchQuery).toHaveBeenCalledWith(apiKey, "custom query", {
        var1: "value1",
      });
    });

    test("handles errors in custom query", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "Custom query error" },
      });

      const result = await service.customQuery("custom query", {
        var1: "value1",
      });

      expect(result).toEqual({
        data: null,
        error: { message: "Custom query error" },
      });
    });
  });
});
