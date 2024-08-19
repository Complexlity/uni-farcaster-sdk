import type { Service } from "@/lib/types";
import { expect, test } from "vitest";

export function isAddress(address: string): boolean {
	return /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
}

type TestedService = Omit<Service, "name"> & { name: string };

export function runBasicTests(service: TestedService) {
	const requiredMethods = [
		"getUserByFid",
		"getUserByUsername",
		"getCastByHash",
		"getCastByUrl",
	];
	test(`${service.name} service should have all required methods`, async () => {
			for (const method of requiredMethods){
					expect(service).toHaveProperty(method);
		}
	});
}


