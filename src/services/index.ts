import { neynarService } from "./neynar";
import { airstackService } from "./airstack";
import { hubService } from "./hub";
import { Service } from "@/types";

export const services = {
  neynar: neynarService,
  airstack: airstackService,
  hub: hubService,
} as const;


export type TService = keyof typeof services;
