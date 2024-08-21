import { expect, test } from "vitest";
import { neynarService } from ".";
import { runBasicTests } from "../../lib/utils";
import { describe } from "node:test";

const service = new neynarService("test-api-key");

runBasicTests(service);

describe("main", () => {
  test("it should error if api key is not provided", async () => {
    expect(() => new neynarService("")).toThrowError();
  });

  test("it should error if customQuery function is missing", async () => {
    expect(service.customQuery).not.toBeUndefined();
  })
});
