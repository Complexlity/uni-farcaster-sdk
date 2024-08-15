import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import uniFarcasterSdk from ".";
import { runBasicTests } from "./utils";
import { services } from "./services";

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