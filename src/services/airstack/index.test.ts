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

  describe("getUsersByFid", () => {
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
              profileBio: "Test bio",
              userAddress: "0x123",
              connectedAddresses: [
                { address: "0x456", blockchain: "ethereum" },
                { address: "sol123", blockchain: "solana" },
              ],
            },

            {
              userId: "789",
              profileName: "testuser2",
              profileDisplayName: "Test User2",
              profileImage: "https://example.com/pfp2.jpg",
              followerCount: 101,
              followingCount: 51,
              profileBio: "Test bio 2",
              userAddress: "0x419",
              connectedAddresses: [
                { address: "0x789", blockchain: "ethereum" },
              ],
            },
          ],
        },
        Following: {
          Following: [
            {
              followingProfileId: "789",
              followerProfileId: "456",
            },
          ],
        },
        Followedby: {
          Following: [
            {
              followingProfileId: "456",
              followerProfileId: "123",
            },
            {
              followingProfileId: "456",
              followerProfileId: "789",
            },
          ],
        },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getUsersByFid([123, 789], 456);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([
        {
          fid: 123,
          username: "testuser",
          displayName: "Test User",
          pfpUrl: "https://example.com/pfp.jpg",
          followerCount: 100,
          followingCount: 50,
          bio: "Test bio",
          ethAddresses: ["0x456", "0x123"],
          solAddresses: ["sol123"],
          viewerContext: { following: false, followedBy: true },
        },
        {
          fid: 789,
          username: "testuser2",
          displayName: "Test User2",
          pfpUrl: "https://example.com/pfp2.jpg",

          followerCount: 101,
          followingCount: 51,
          bio: "Test bio 2",
          ethAddresses: ["0x789", "0x419"],
          solAddresses: [],
          viewerContext: { following: true, followedBy: true },
        },
      ]);
    });

    test("handles API errors", async () => {
      vi.mocked(fetchQuery).mockResolvedValue({
        data: null,
        error: { message: "API Error" },
      });

      const result = await service.getUsersByFid([123], 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "API Error" });
    });

    test("returns error if user object is empty", async () => {
      const mockResult: AirstackUserQueryResult = {
        Socials: {
          Social: [],
        },
        Following: {
          Following: [],
        },
        Followedby: {
          Following: [],
        },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const users = [123, 345];

      const result = await service.getUsersByFid(users, 456);
      expect(result.data).toEqual([]);

      expect(result.error).toBeNull();
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
      test("returns error if user object is empty", async () => {
        const mockResult: AirstackUserQueryResult = {
          Socials: {
            Social: [],
          },
          Following: {
            Following: [],
          },
          Followedby: {
            Following: [],
          },
        };

        vi.mocked(fetchQuery).mockResolvedValue({
          data: mockResult,
          error: null,
        });

        const result = await service.getUserByUsername("nonexistent", 456);

        expect(result.data).toBeNull();
        expect(result.error).toEqual({
          message: `user with username "nonexistent" not found`,
        });
      });
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

    test("returns error if cast object is empty", async () => {
      const mockResult: AirstackCastQueryResult = {
        FarcasterCasts: {
          Cast: [],
        },
        LikedBy: { Reaction: null },
        RecastedBy: { Reaction: null },
      };

      vi.mocked(fetchQuery).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await service.getCastByHash("test-hash", 456);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: `cast with hash "test-hash" not found`,
      });
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
        456
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

    test("returns error if cast object is empty", async () => {
      const mockResult: AirstackCastQueryResult = {
        FarcasterCasts: {
          Cast: [],
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
        456
      );

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: `cast with url "https://warpcast.com/testuser/0123456789" not found`,
      });
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
