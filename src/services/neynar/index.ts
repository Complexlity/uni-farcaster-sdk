import { Cast, Service, User, DataOrError } from "@/types";
import axios from "axios";
import {
  CastFetchResult,
  convertToV2User,
  NeynarCast,
  NeynarUser,
} from "./utils";
import { TService } from "@/services";
import { AxiosError } from "axios";
import { DEFAULTS } from "@/constants";

const BASE_URL = "https://api.neynar.com";
const api = axios.create({
  baseURL: BASE_URL,
});

export class neynarService implements Service {
  private apiKey: string;
  public name: TService = "neynar";

  constructor(apiKey: string) {
     if (!apiKey) {
       throw new Error(
         "Attempt to use an neynar API without first providing an api key"
       );
     }
    this.apiKey = apiKey;
  }

  private handleError(e: any) {
    if(e instanceof AxiosError) {
        return { data: null, error: {message: e.response?.data?.error.message} };
      }
      return { data: null, error: e };
    }


  private getHeaders() {
    return {
      accept: "application/json",
      api_key: this.apiKey,
    };
  }

  private getUserFromNeynarResponse(user: NeynarUser): User {
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile.bio.text,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      ethAddresses: [
        ...user.verified_addresses.eth_addresses,
        user.custody_address,
      ],
      solAddresses: [...user.verified_addresses.sol_addresses],
      viewerContext: {
        following: user.viewer_context.following,
        followedBy: user.viewer_context.followed_by,
      },
      ...(user.power_badge ? { powerBadge: user.power_badge } : {}),
    };
  }

  private getCastFromNeynarResponse(cast: NeynarCast): Cast {
    return {
      author: this.getUserFromNeynarResponse(cast.author),
      userReactions: {
        likes: cast.reactions.likes_count,
        recasts: cast.reactions.recasts_count,
      },
      viewerContext: {
        liked: cast.viewer_context.liked,
        recasted: cast.viewer_context.recasted,
      },
      text: cast.text,
      embeds: cast.embeds,
      channel: !!cast.channel ? cast.channel.name : null,
    };
  }
  async getUserByFid(
    fid: number,
    viewerFid: number = DEFAULTS.fid
  ): Promise<DataOrError<User>> {
    try {
      const usersInfo = await api.get<{ users: NeynarUser[] }>(
        "/v2/farcaster/user/bulk",
        {
          params: {
            fids: `${fid}`,
            viewer_fid: `${viewerFid}`,
          },
          headers: this.getHeaders(),
        }
      );

      const [user] = usersInfo.data.users;
      const returnedUser = this.getUserFromNeynarResponse(user);
      return { data: returnedUser, error: null };
    } catch (e) {
      return this.handleError(e)
    }
  }
    async getUserByUsername(
    username: string,
    viewerFid?: number
  ): Promise<DataOrError<Omit<User, "powerBadge">>> {
    try {
      const usersInfo = await api.get<{ result: { user: any } }>(
        "/v1/farcaster/user-by-username",
        {
          params: {
            username: `${username}`,
            viewerFid: `${viewerFid}`,
          },
          headers: this.getHeaders(),
        }
      );

      const v1User = usersInfo.data.result.user;
      const v2User = convertToV2User(v1User);
      const returnedUser = this.getUserFromNeynarResponse(v2User);
      return { data: returnedUser, error: null };
    } catch (e) {
      return this.handleError(e);
    }
  }

  async getCastByHash(
    hash: string,
    viewerFid: number = DEFAULTS.fid
  ): Promise<DataOrError<Cast>> {
    try {
      const castInfo = await api.get<CastFetchResult>("/v2/farcaster/cast", {
        params: {
          type: "hash",
          identifier: hash,
          viewer_fid: `${viewerFid}`,
        },
        headers: this.getHeaders(),
      });

      const cast = castInfo.data.cast;
      const returnedCast = this.getCastFromNeynarResponse(cast);
      return { data: returnedCast, error: null };
    } catch (e) {
      return this.handleError(e);
    }
  }

  async getCastByUrl(
    url: string,
    viewerFid: number = DEFAULTS.fid
  ): Promise<DataOrError<Cast>> {
    try {
      const castInfo = await api.get<CastFetchResult>("/v2/farcaster/cast", {
        params: {
          type: "url",
          identifier: url,
          viewer_fid: `${viewerFid}`,
        },
        headers: this.getHeaders(),
      });

      const cast = castInfo.data.cast;
      const returnedCast = this.getCastFromNeynarResponse(cast);
      return { data: returnedCast, error: null };
    } catch (e) {
      return this.handleError(e);
    }
  }
}
