import { neynarService } from "@/services/neynar";
import { airstackService } from "@/services/airstack";
import { hubService } from "@/services/hub";
import { Service } from "@/types";



export const  services = {
  neynar: neynarService,
  airstack: airstackService,
  hub: hubService,
} as const;


export type TService = keyof typeof services;
