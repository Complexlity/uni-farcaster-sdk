import { describe } from "node:test";
import { expect, test } from "vitest";
import { airstackService } from ".";
import { runBasicTests } from "../../lib/utils";

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
