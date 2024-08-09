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
import {
  AirstackCastQueryResult,
  AirstackUserQueryResult as AirstackUserQueryResult,
  Socials,
} from "./types";

export class airstackService {
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    init(this.apiKey);
  }

  private getUserFromAirstackSociaslResult(
    userDetails: AirstackUserQueryResult["Socials"]["Social"][0]
  ) {
    const userAddresses = this.getUserAddresses(userDetails.connectedAddresses);
    const convertedUser = {
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

  private getCastFromAirstackResult(castResult: AirstackCastQueryResult) {
    const convertedCast: Cast = {
      author: this.getUserFromAirstackSociaslResult(
        castResult.FarcasterCasts.Cast[0]!.castedBy
      ),
      userReactions: {
        likes: castResult.FarcasterCasts.Cast[0]!.numberOfLikes,
        recasts: castResult.FarcasterCasts.Cast[0]!.numberOfRecasts,
      },
      viewerContext: {
        liked: !!castResult.LikedBy.Reaction,
        recasted: !!castResult.RecastedBy.Reaction,
      },
      text: castResult.FarcasterCasts.Cast[0]!.text,
      embeds: castResult.FarcasterCasts.Cast[0]!.embeds,
      channel: castResult.FarcasterCasts.Cast[0]!.channel.name,
    };
    return convertedCast;
  }

  async getUserByFid(fid: number, viewerFid: number): Promise<User> {
    const query = userByFidQuery(fid, viewerFid);
    const { data, error } = await fetchQuery(query);
    const returnedData = data as AirstackUserQueryResult;
    const user = this.getUserFromAirstackSociaslResult(
      returnedData.Socials.Social[0]
    );
    const viewerContext = {
      following: !!returnedData.Following.Following,
      followedBy: !!returnedData.Followedby.Following,
    };
    return { ...user, viewerContext };
  }

  async getUserByUsername(
    username: string
  ): Promise<Omit<User, "viewerContext">> {
    const query = userByUsernameQuery(username);
    const { data, error } = await fetchQuery(query);
    const returnedData = data as Omit<
      AirstackUserQueryResult,
      "Following" | "Followedby"
    >;
    return this.getUserFromAirstackSociaslResult(
      returnedData.Socials.Social[0]
    );
  }

  async getCastByHash(hash: string, viewerFid: number): Promise<Cast> {
    const query = castByHashQuery(hash, viewerFid);
    const { data, error } = await fetchQuery(query);
    fs.writeFileSync("cast.json", JSON.stringify(data, null, 2));
    const returnedData = data as AirstackCastQueryResult;
    return this.getCastFromAirstackResult(returnedData);
  }

  async getCastByUrl(url: string, viewerFid: number): Promise<Cast> {
    const query = castByUrlQuery(url, viewerFid);
    const { data, error } = await fetchQuery(query);
    const returnedData = data as AirstackCastQueryResult;
    return this.getCastFromAirstackResult(returnedData);
  }
}
