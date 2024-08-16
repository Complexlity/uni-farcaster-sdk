import { LogLevel } from "./logger";
import { TService } from "./services";

export type DataOrError<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: {message: string};
    };

export type User = {
  fid: number;
  ethAddresses: string[];
  solAddresses: string[];
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  viewerContext: {
    following: boolean;
    followedBy: boolean;
  };
};

export type Cast = {
  author: UserWithOptionalViewerContext;
  hash: string;
  url: string
  userReactions: {
    likes: number;
    recasts: number;
  };
  viewerContext: {
    liked: boolean;
    recasted: boolean;
  };
  text: string;
  embeds: any[];
  channel: string | null;
};
type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type UserWithOptionalViewerContext = Prettify<Omit<User, "viewerContext">> &
  Partial<{ viewerContext: User["viewerContext"] }>;

export interface Service {
  name: TService;
  getUserByFid(fid: number, viewerFid?: number): Promise<DataOrError<User>>;
  getUserByUsername(
    username: string,
    viewerFid?: number
  ): Promise<DataOrError<UserWithOptionalViewerContext>>;
  getCastByHash(hash: string, viewerFid?: number): Promise<DataOrError<Cast>>;
  getCastByUrl(url: string, viewerFid?: number): Promise<DataOrError<Cast>>;
}

export type Config =
(| {
    neynarApiKey: string;
    airstackApiKey: string;
    activeService: TService;
  }
  | {
      neynarApiKey: string;
    }
  | {
      airstackApiKey: string;
    }
  ) & (
    | {
    debug?: boolean

    }
    | {
      debug: true,
      logLevel?: LogLevel
    }
  )
  & {
    cacheTtl? : number
  }