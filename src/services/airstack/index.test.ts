import { expect, test } from "vitest";
import { airstackService } from ".";
import { runBasicTests } from "../../utils";

const service = new airstackService("test-api-key");

runBasicTests(service);

test("it should error if api key is not provided", async () => {
  expect(() => new airstackService("")).toThrowError();
});
