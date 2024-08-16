import { expect, test } from "vitest";
import { hubService } from ".";
import { runBasicTests } from
"../../lib/utils";

const service = new hubService("https://testhub.com");

runBasicTests(service);

test("it should error if hub url is not provided", async () => {
  expect(() => new hubService("")).toThrowError();
});
