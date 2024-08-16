import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import uniFarcasterSdk from ".";
import { runBasicTests } from "./lib/utils";
import { services } from "./services";
import { Cache } from "./lib/cache";

const service = new uniFarcasterSdk({
  neynarApiKey: "test-neynar-api-key",
  airstackApiKey: "test-airstack-api-key",
  activeService: "neynar",
});

let consoleSpy: ReturnType<typeof vi.spyOn>;
consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

runBasicTests(service);

test("it should take config active service", async () => {
  expect(service.getActiveService()).toBe("neynar");
});

test("it should ignore the config active service if it is not valid", async () => {
  const service = new uniFarcasterSdk({
    airstackApiKey: "test-airstack-api-key",
    activeService: "neynar",
  });
  expect(service.getActiveService()).toBe("airstack");
});
test("it should pick a default service randomly if no active service is provided", async () => {
  const service = new uniFarcasterSdk({
    neynarApiKey: "test-neynar-api-key",
    airstackApiKey: "test-airstack-api-key",
  });
  const expectArray = Object.keys(services);
  const activeService = service.getActiveService();
  expect(expectArray).toContain(activeService);
});

test("it should default active service depending on the api key provided", async () => {
  const defaultService = new uniFarcasterSdk({
    neynarApiKey: "test-neynar-api-key",
    activeService: "airstack",
  });
  expect(defaultService.getActiveService()).toBe("neynar");
});

test("it should error if api key is not provided", async () => {
  expect(
    () =>
      new uniFarcasterSdk({
        activeService: "neynar",
      })
  ).toThrowError();
});

test("it should not error if not config is not provided", async () => {
  expect(() => new uniFarcasterSdk({})).toThrowError();
});

describe("debug mode", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("It should not log anything if no logger is provided", async () => {
    const service = new uniFarcasterSdk({
      neynarApiKey: "test-neynar-api-key",
      airstackApiKey: "test-airstack-api-key",
      activeService: "neynar",
    });
    service.getActiveService();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test("It should log if logger is provided", async () => {
    const service = new uniFarcasterSdk({
      neynarApiKey: "test-neynar-api-key",
      airstackApiKey: "test-airstack-api-key",
      activeService: "neynar",
      debug: true,
    });
    service.getActiveService();
    expect(consoleSpy).toHaveBeenCalled();
  });

  test("It should not log if loglevel doesn't match", async () => {
    const service = new uniFarcasterSdk({
      neynarApiKey: "test-neynar-api-key",
      airstackApiKey: "test-airstack-api-key",
      activeService: "neynar",
      debug: true,
      logLevel: "error",
    });

    service.getActiveService();
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe("main cache", () => {
  let sdk: uniFarcasterSdk;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      name: "mockService",
      getUserByFid: vi.fn(),
      getUserByUsername: vi.fn(),
      getCastByHash: vi.fn(),
      getCastByUrl: vi.fn(),
    };

    sdk = new uniFarcasterSdk({ neynarApiKey: "mock-key" });
    // @ts-expect-error Accessing private property for testing
    sdk.activeService = mockService;
    // @ts-expect-error Accessing private property for testing
    sdk.cache = new Cache();
  });

  test("should use cache for getUserByFid", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    mockService.getUserByFid.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // First call should hit the service
    const result1 = await sdk.getUserByFid(123);
    expect(result1.data).toEqual(mockUser);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await sdk.getUserByFid(mockUser.fid);
    expect(result2.data).toEqual(mockUser);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Second call should use cache
    const result3 = await sdk.getUserByUsername(mockUser.username);
    expect(result3.data).toEqual(mockUser);
    expect(mockService.getUserByUsername).not.toBeCalled(); // Still 1, not 2
  });

  test("should use cache for getUserByUsername", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    mockService.getUserByUsername.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // First call should hit the service
    const result1 = await sdk.getUserByUsername(mockUser.username);
    expect(result1.data).toEqual(mockUser);
    expect(mockService.getUserByUsername).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await sdk.getUserByUsername(mockUser.username);
    expect(result2.data).toEqual(mockUser);
    expect(mockService.getUserByUsername).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Third call with fid should still use cache
    const result3 = await sdk.getUserByFid(mockUser.fid);
    expect(result3.data).toEqual(mockUser);
    expect(mockService.getUserByFid).not.toBeCalled();
  });

  test("should use cache for getCastByHash", async () => {
    const mockCast = {
      hash: "0x59821dAf7b797D926440C9088bb91e018d6556B8",
      url: "https://example.com/cast/123",
    };
    mockService.getCastByHash.mockResolvedValueOnce({
      data: mockCast,
      error: null,
    });

    // First call should hit the service
    const result1 = await sdk.getCastByHash(mockCast.hash);
    expect(result1.data).toEqual(mockCast);
    expect(mockService.getCastByHash).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await sdk.getCastByHash(mockCast.hash);
    expect(result2.data).toEqual(mockCast);
    expect(mockService.getCastByHash).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Call by url should still use cache
    const result3 = await sdk.getCastByUrl(mockCast.url);
    expect(result3.data).toEqual(mockCast);
    expect(mockService.getCastByUrl).not.toBeCalled();
  });

  test("should use cache for getCastByUrl", async () => {
    const mockCast = {
      url: "https://example.com/cast/123",
      hash: "0x59821dAf7b797D926440C9088bb91e018d6556B8",
    };
    mockService.getCastByUrl.mockResolvedValueOnce({
      data: mockCast,
      error: null,
    });

    // First call should hit the service
    const result1 = await sdk.getCastByUrl(mockCast.url);
    expect(result1.data).toEqual(mockCast);
    expect(mockService.getCastByUrl).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await sdk.getCastByUrl(mockCast.url);
    expect(result2.data).toEqual(mockCast);
    expect(mockService.getCastByUrl).toHaveBeenCalledTimes(1);

    // Call by hash should still use cache
    const result3 = await sdk.getCastByHash(mockCast.hash);
    expect(result3.data).toEqual(mockCast);
    expect(mockService.getCastByHash).not.toHaveBeenCalled();
  });
});
