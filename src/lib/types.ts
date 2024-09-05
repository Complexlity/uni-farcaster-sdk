import type { TService } from "../services";
import type { LogLevel } from "./logger";

export type DataOrError<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: { message: string };
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
  viewerContext: {
    following: boolean;
    followedBy: boolean;
  };
};

export type Cast = {
  author: UserWithOptionalViewerContext;
  hash: string;
  url: string;
  userReactions: {
    likes: number;
    recasts: number;
  };
  viewerContext: {
    liked: boolean;
    recasted: boolean;
  };
  text: string;
  embeds: unknown[];
  channel: string | null;
};
type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type UserWithOptionalViewerContext = Prettify<
  Omit<User, "viewerContext">
> &
  Partial<{ viewerContext: User["viewerContext"] }>;

export interface Service {
  name: TService;
  getUsersByFid(
    fids: number[],
    viewerFid?: number
  ): Promise<DataOrError<User[]>>;
  getUserByUsername(
    username: string,
    viewerFid?: number
  ): Promise<DataOrError<UserWithOptionalViewerContext>>;
  getCastByHash(hash: string, viewerFid?: number): Promise<DataOrError<Cast>>;
  getCastByUrl(url: string, viewerFid?: number): Promise<DataOrError<Cast>>;
  customQuery<T>(
    query: string,
    params: Record<string, unknown>
  ): Promise<DataOrError<T>>;
}

export type Config = {
  neynarApiKey?: string;
  airstackApiKey?: string;
  activeService?: TService;
  cacheTtl?: number;
  retries?: number;
  retryStrategy?: RetryStrategy;
  debug?: boolean;
  logLevel?: LogLevel;
};

export type RetryStrategy = "normal" | "switch" | "switchTemp";
