import { Service } from "@/types";
import { expect, test } from 'vitest'

export function isAddress(address: string): boolean  {
  return /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
}

type TestedService = Omit<Service, "name"> & {name: string}

export function runBasicTests(service: TestedService) {
  const requiredMethods = [
    "getUserByFid",
    "getUserByUsername",
    "getCastByHash",
    "getCastByUrl",
  ]
  {
    test(`${service.name} service should have all required methods`, async () => {
      requiredMethods.forEach((method) => {
        expect(service).toHaveProperty(method);
      });
    })
  }
}