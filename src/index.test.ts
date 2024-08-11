import { expect, test } from "vitest";
import uniFarcasterSdk from ".";
import { runBasicTests } from "@/utils";

const service = new uniFarcasterSdk({
  hubUrl: "https://testhub.com",
  neynarApiKey: "test-neynar-api-key",
	airstackApiKey: "test-airstack-api-key",
	activeService: "neynar",
});

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

test("it should default active service to hub", async () => {
	const defaultService = new uniFarcasterSdk({
		activeService: "airstack",
	})
	expect(defaultService.getActiveService()).toBe("hub");
})

test("it should set active service depending on", async () => {
	const defaultService = new uniFarcasterSdk({
		activeService: "airstack",
	})
	expect(defaultService.getActiveService()).toBe("hub");
})



test("it should not error if no config is not provided", async () => {
  expect(() => new uniFarcasterSdk({})).not.toThrowError();
});

