import { services } from "../services";
import { expect, test } from "vitest";

test("all service names should be the same as the service object keys", () => {
  for (const [serviceKey, service] of Object.entries(services)) {
    const newServiceInstance = new service("test-api-key");
    expect(serviceKey).toBe(newServiceInstance.name);
  }
});
