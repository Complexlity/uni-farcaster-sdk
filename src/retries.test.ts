import { type Mock, beforeEach, describe, expect, test, vi } from "vitest";
import uniFarcasterSdk from ".";
import { DataOrError } from "./lib/types";
import { services } from "./services";

vi.mock("./services", () => ({
  services: {
    neynar: vi.fn(),
    airstack: vi.fn(),
  },
}));

const DUMMY_CAST_HASH = "0x59821dAf7b797D926440C9088bb91e018d6556B8";

describe("uniFarcasterSdk with retries", () => {
  let sdk: uniFarcasterSdk;
  let mockService: {
    name: string;
    getUserByFid: Mock;
    getUserByUsername: Mock;
    getCastByHash: Mock;
    getCastByUrl: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      name: "mockService",
      getUserByFid: vi.fn(),
      getUserByUsername: vi.fn(),
      getCastByHash: vi.fn(),
      getCastByUrl: vi.fn(),
    };

    sdk = new uniFarcasterSdk({
      neynarApiKey: "mock-key",
      airstackApiKey: "mock-airstack-key",
      retries: 2,
    });
    // @ts-expect-error Accessing private property for testing
    sdk.activeService = mockService;
  });

  test("should retry getUserByFid on error", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    const errorResponse: DataOrError<typeof mockUser> = {
      data: null,
      error: { message: "Error" },
    };
    const successResponse: DataOrError<typeof mockUser> = {
      data: mockUser,
      error: null,
    };

    mockService.getUserByFid
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await sdk.getUserByFid(mockUser.fid);

    expect(result).toEqual(successResponse);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(3);
  });

  test("should return last error if all retries fail", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    const errorResponse: DataOrError<typeof mockUser> = {
      data: null,
      error: { message: "Error" },
    };

    mockService.getUserByFid.mockResolvedValue(errorResponse);

    const result = await sdk.getUserByFid(mockUser.fid);

    expect(result).toEqual(errorResponse);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(3);
  });

  test("should not retry if first attempt is successful", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    const successResponse: DataOrError<typeof mockUser> = {
      data: mockUser,
      error: null,
    };

    mockService.getUserByFid.mockResolvedValue(successResponse);

    const result = await sdk.getUserByFid(mockUser.fid);

    expect(result).toEqual(successResponse);
    expect(mockService.getUserByFid).toHaveBeenCalledTimes(1);
  });

  test("should retry getUserByUsername on error", async () => {
    const mockUser = { fid: 123, username: "testuser" };
    const errorResponse: DataOrError<typeof mockUser> = {
      data: null,
      error: { message: "Error" },
    };
    const successResponse: DataOrError<typeof mockUser> = {
      data: mockUser,
      error: null,
    };

    mockService.getUserByUsername
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await sdk.getUserByUsername(mockUser.username);

    expect(result).toEqual(successResponse);
    expect(mockService.getUserByUsername).toHaveBeenCalledTimes(3);
  });

  test("should retry getCastByHash on error", async () => {
    const mockCast = { hash: DUMMY_CAST_HASH, text: "Test cast" };
    const errorResponse: DataOrError<typeof mockCast> = {
      data: null,
      error: { message: "Error" },
    };
    const successResponse: DataOrError<typeof mockCast> = {
      data: mockCast,
      error: null,
    };

    mockService.getCastByHash
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await sdk.getCastByHash(mockCast.hash);

    expect(result).toEqual(successResponse);
    expect(mockService.getCastByHash).toHaveBeenCalledTimes(3);
  });

  test("should retry getCastByUrl on error", async () => {
    const mockCast = { url: "https://example.com/cast/123", text: "Test cast" };
    const errorResponse: DataOrError<typeof mockCast> = {
      data: null,
      error: { message: "Error" },
    };
    const successResponse: DataOrError<typeof mockCast> = {
      data: mockCast,
      error: null,
    };

    mockService.getCastByUrl
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await sdk.getCastByUrl(mockCast.url);

    expect(result).toEqual(successResponse);
    expect(mockService.getCastByUrl).toHaveBeenCalledTimes(3);
  });

  test("should retry neynar custom query on error", async () => {
    const mockCustomQuery = vi.fn();
    mockCustomQuery
      .mockResolvedValueOnce({ data: null, error: { message: "Error 1" } })
      .mockResolvedValueOnce({ data: null, error: { message: "Error 2" } })
      .mockResolvedValueOnce({ data: { message: "success" }, error: null });

    vi.mocked(services.neynar).mockImplementation(() => ({
      customQuery: mockCustomQuery,
    }));

    const result = await sdk.neynar("/test-endpoint", { param1: "value" });

    expect(result).toEqual({ data: { message: "success" }, error: null });
    expect(mockCustomQuery).toHaveBeenCalledTimes(3);
  });

  test("should retry airstack custom query on error", async () => {
    const mockCustomQuery = vi.fn();
    mockCustomQuery
      .mockResolvedValueOnce({ data: null, error: { message: "Error 1" } })
      .mockResolvedValueOnce({ data: null, error: { message: "Error 2" } })
      .mockResolvedValueOnce({ data: { message: "success" }, error: null });

    vi.mocked(services.airstack).mockImplementation(() => ({
      customQuery: mockCustomQuery,
    }));

    const result = await sdk.airstack("query { example }", { param1: "value" });

    expect(result).toEqual({ data: { message: "success" }, error: null });
    expect(mockCustomQuery).toHaveBeenCalledTimes(3);
  });
});
