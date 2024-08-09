import { neynarService } from "./neynar";
import { airstackService } from "./airstack";
import { hubService } from "./hub";

export const services = {
  neynar: neynarService,
  airstack: airstackService,
  hub: hubService,
};

export type Service = { name: string } & any;

export type TService = keyof typeof services;
