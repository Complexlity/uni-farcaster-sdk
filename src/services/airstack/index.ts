import { Service } from "..";
import { User, Cast } from "../../playground";
import { init, fetchQuery } from "@airstack/node";
import {
  castByHashQuery,
  castByUrlQuery,
  userByFidQuery,
  userByUsernameQuery,
} from "./utils";
import fs from "fs";
import { AirstackUserFetchResult } from "./types";

export class airstackService {
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    init(this.apiKey);
  }

  private getUserFromAirstackSociaslResult(data: AirstackUserFetchResult["Socials"]) {
    const userDetails = data.Social[0];
    const userAddresses = this.getUserAddresses(userDetails.connectedAddresses);
    const convertedUser: User = {
      fid: Number(userDetails.userId),
      username: userDetails.profileName,
      displayName: userDetails.profileDisplayName,
      pfpUrl: userDetails.profileImage,
      followerCount: userDetails.followerCount,
      followingCount: userDetails.followingCount,
      powerBadge: userDetails.isFarcasterPowerUser,
      bio: userDetails.profileBio,
      ethAddresses: [...userAddresses.ethAddresses, userDetails.userAddress],
      solAddresses: [...userAddresses.solAddresses],
    };
    return convertedUser;
  }

  private getUserAddresses(
    userAddresses: { address: string; blockchain: string }[]
  ) {
    const ethAddresses: string[] = [];
    const solAddresses: string[] = [];
    for (const address of userAddresses) {
      if (address.blockchain === "ethereum") {
        ethAddresses.push(address.address);
      }
      if (address.blockchain === "solana") {
        solAddresses.push(address.address);
      }
    }
    return { ethAddresses, solAddresses };
  }

  async getUserByFid(fid: number, viewerFid: number): Promise<User> {
    const query = userByFidQuery(fid, viewerFid);
    const { data, error } = await fetchQuery(query);
    const returnedData = data as AirstackUserFetchResult;
    const user = this.getUserFromAirstackSociaslResult(returnedData.Socials);
    const viewerContext = {
      following: !!returnedData.Following.Following,
      followedBy: !!returnedData.Followedby.Following,
    }
    user.viewerContext = viewerContext;
    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    const query = userByUsernameQuery(username);
    const { data, error } = await fetchQuery(query);
    const returnedData = data as Omit<AirstackUserFetchResult, "Following" | "Followedby">;
    return this.getUserFromAirstackSociaslResult(returnedData.Socials);
  }

  async getCastByHash(hash: string, viewerFid: number): Promise<Cast> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  }

  async getCastByUrl(url: string, viewerFid: number): Promise<Cast> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  }
}
