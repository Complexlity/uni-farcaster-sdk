import { neynarService } from "./neynar";
import { airstackService } from "./airstack";
import { hubService } from "./hub";
import { Service } from "@/types";

interface ServiceConstructor {
  new (...args: any[]): Service;
}

export const services: Record<string, ServiceConstructor> = {
  neynar: neynarService,
  airstack: airstackService,
  hub: hubService,
};


export type TService = keyof typeof services;
