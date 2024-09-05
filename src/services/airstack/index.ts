import type { Cast, DataOrError, Service, User } from "@/lib/types";
import type { TService } from "..";
import type { AirstackCastQueryResult, AirstackUserQueryResult } from "./types";
import {
  castByHashQuery,
  castByUrlQuery,
  fetchQuery,
  userByUsernameQuery,
  usersByFidQuery,
} from "./utils";

export class airstackService implements Service {
  private apiKey: string;
  public name: TService = "airstack";
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      throw new Error(
        "Attempt to use an airstack API without first providing an api key"
      );
    }
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
      hash: castResult.FarcasterCasts.Cast[0]?.hash,
      url: castResult.FarcasterCasts.Cast[0]?.url,
      author: this.getUserFromAirstackSociaslResult(
        castResult.FarcasterCasts.Cast[0]?.castedBy
      ),
      userReactions: {
        likes: castResult.FarcasterCasts.Cast[0]?.numberOfLikes,
        recasts: castResult.FarcasterCasts.Cast[0]?.numberOfRecasts,
      },
      viewerContext: {
        liked: !!castResult.LikedBy.Reaction,
        recasted: !!castResult.RecastedBy.Reaction,
      },
      text: castResult.FarcasterCasts.Cast[0]?.text,
      embeds: castResult.FarcasterCasts.Cast[0]?.embeds,
      channel: castResult.FarcasterCasts.Cast[0]?.channel.name,
    };
    return convertedCast;
  }

  async getUsersByFid(
    fids: number[],
    viewerFid: number
  ): Promise<DataOrError<User[]>> {
    const query = usersByFidQuery(fids, viewerFid);
    const { data, error } = await fetchQuery<AirstackUserQueryResult>(
      this.apiKey,
      query
    );
    if (error) {
      return { data, error };
    }
    const returnedData = data;

    const users = returnedData.Socials.Social.map((user) => {
      const tempUser = this.getUserFromAirstackSociaslResult(user);
      const isFollowing = returnedData.Following.Following?.find(
        (following) => following.followingProfileId === tempUser.fid.toString()
      );

      const isFollowedBy = returnedData.Followedby.Following?.find(
        (following) => following.followerProfileId === tempUser.fid.toString()
      );
      return {
        ...tempUser,
        viewerContext: {
          following: !!isFollowing,
          followedBy: !!isFollowedBy,
        },
      };
    });

    return { data: users, error: null };
  }

  async getUserByUsername(
    username: string,
    _viewerFid: number
  ): Promise<DataOrError<Omit<User, "viewerContext">>> {
    const query = userByUsernameQuery(username);
    const { data, error } = await fetchQuery<
      Omit<AirstackUserQueryResult, "Following" | "Followedby">
    >(this.apiKey, query);
    if (error) {
      return { data, error };
    }

    const returnedData = data;
    if (!returnedData.Socials.Social || returnedData.Socials.Social.length == 0)
      return {
        data: null,
        error: { message: `user with username "${username}" not found` },
      };
    return {
      data: this.getUserFromAirstackSociaslResult(
        returnedData.Socials.Social[0]
      ),
      error: null,
    };
  }

  async getCastByHash(
    hash: string,
    viewerFid: number
  ): Promise<DataOrError<Cast>> {
    const query = castByHashQuery(hash, viewerFid);
    const { data, error } = await fetchQuery<AirstackCastQueryResult>(
      this.apiKey,
      query
    );
    if (error) {
      return { data, error };
    }
    if (!data.FarcasterCasts?.Cast || data.FarcasterCasts.Cast.length == 0)
      return {
        data: null,
        error: { message: `cast with hash "${hash}" not found` },
      };
    const returnedData = data;
    return { data: this.getCastFromAirstackResult(returnedData), error: null };
  }

  async getCastByUrl(
    url: string,
    viewerFid: number
  ): Promise<DataOrError<Cast>> {
    const query = castByUrlQuery(url, viewerFid);
    const { data, error } = await fetchQuery<AirstackCastQueryResult>(
      this.apiKey,
      query
    );
    if (error) {
      return { data, error };
    }

    if (!data.FarcasterCasts?.Cast || data.FarcasterCasts.Cast.length == 0)
      return {
        data: null,
        error: { message: `cast with url "${url}" not found` },
      };
    const returnedData = data;
    return { data: this.getCastFromAirstackResult(returnedData), error: null };
  }

  async customQuery<T>(query: string, variables: Record<string, unknown>) {
    return await fetchQuery<T>(this.apiKey, query, variables);
  }
}
