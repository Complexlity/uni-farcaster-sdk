import { airstackService } from "@/services/airstack";
import { neynarService } from "@/services/neynar";

export const services = {
	neynar: neynarService,
	airstack: airstackService,
} as const;

export type TService = keyof typeof services;
