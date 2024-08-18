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

const mockUser = { fid: 123, username: "testuser" };

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
    mockService.getUserByFid.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // First call should hit the service
    const result1 = await sdk.getUserByFid(mockUser.fid);
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
      url: "https://example.com/cast/mockUser.fid",
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
      url: "https://example.com/cast/mockUser.fid",
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

describe("uniFarcasterSdk Cache with cacheTtl", () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      name: "mockService",
      getUserByFid: vi.fn(),
    };
  });

  test("should use cache when cacheTtl is not 0", async () => {
    const sdk = new uniFarcasterSdk({
      neynarApiKey: "mock-key",
      cacheTtl: 3000,
    });
    // @ts-expect-error Accessing private property for testing
    sdk.activeService = mockService;

    mockService.getUserByFid.mockResolvedValue({ data: mockUser, error: null });

    // First call should hit the service
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1); 
  });

  test("should bypass cache when cacheTtl is 0", async () => {
    const sdk = new uniFarcasterSdk({ neynarApiKey: "mock-key", cacheTtl: 0 });
    // @ts-expect-error Accessing private property for testing
    sdk.activeService = mockService;


    mockService.getUserByFid.mockResolvedValue({ data: mockUser, error: null });

    // First call should hit the service
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1);

    // Second call should also hit the service, bypassing cache
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(2);
  });

  test("should expire cache after cacheTtl", async () => {
    const cacheTtl = 100;
    const sdk = new uniFarcasterSdk({ neynarApiKey: "mock-key", cacheTtl });
    // @ts-expect-error Accessing private property for testing
    sdk.activeService = mockService;

    mockService.getUserByFid.mockResolvedValue({ data: mockUser, error: null });

    // First call should hit the service
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1); // Still 1, cache hit

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, cacheTtl + 10)); // Wait just a bit longer than TTL

    // Third call should hit the service again
    await sdk.getUserByFid(mockUser.fid);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(2);
  });
});
