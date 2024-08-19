import { expect, test } from "vitest";
import { neynarService } from ".";
import { runBasicTests } from "../../lib/utils";

const service = new neynarService("test-api-key");

runBasicTests(service);

test("it should error if api key is not provided", async () => {
	expect(() => new neynarService("")).toThrowError();
});
