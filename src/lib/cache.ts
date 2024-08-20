import { DEFAULTS } from "./constants";
import type { Cast, User, UserWithOptionalViewerContext } from "./types";

export type StringOrNumberArray = (string | number)[];

type MapData<T> = {
  data: T;
  timestamp: number;
};

export class Cache {
  private cache = new Map<
    string,
    MapData<User | UserWithOptionalViewerContext | Cast>
  >();
  public ttl: number;
  constructor(config: CacheConfig = { ttl: DEFAULTS.cacheTtl }) {
    this.ttl = config.ttl;
  }

  public setTtl(ttl: number) {
    this.ttl = ttl;
  }

  private getData<T>(key: string): T | null {
    const cachedData = this.cache.get(key);
    if (cachedData && cachedData.timestamp + this.ttl > Date.now()) {
      return cachedData.data as T;
    }

    if (cachedData) {
      this.cache.delete(key);
    }
    return null;
  }

  private getUserCachedData(params: StringOrNumberArray) {
    const cacheKey = `${["user", ...params].join(":")}`;
    return this.getData<User | UserWithOptionalViewerContext>(cacheKey);
  }

  private getCastCachedData(params: StringOrNumberArray) {
    const cacheKey = `${["cast", ...params].join(":")}`;

    return this.getData<Cast>(cacheKey) as Cast | null;
  }

  private setUserCachedData(data: User, params: StringOrNumberArray) {
    const fidKey = `${["user", data.fid, ...params].join(":")}`;
    const usernameKey = `${["user", data.username, ...params].join(":")}`;
    const setData = { data, timestamp: Date.now() };
    this.cache.set(fidKey, setData);
    this.cache.set(usernameKey, setData);
    return data;
  }
  private setCastCachedData(data: Cast, params: StringOrNumberArray): Cast {
    const hashKey = `${["cast", data.hash, ...params].join(":")}`;
    const urlKey = `${["cast", data.url, ...params].join(":")}`;
    const setData = { data, timestamp: Date.now() };
    this.cache.set(hashKey, setData);
    this.cache.set(urlKey, setData);
    return data;
  }

  public get<T extends CacheKeys>(type: T, params: StringOrNumberArray) {
    if (type === "user") {
      return this.getUserCachedData(params) as T extends "user"
        ? User | UserWithOptionalViewerContext | null
        : never;
    }
    if (type === "cast") {
      return this.getCastCachedData(params) as T extends "cast"
        ? Cast | null
        : never;
    }
    //Add more cache types if more queries are added
    throw new Error("Invalid cache type");
  }

  public set<T extends CacheKeys>(
    type: T,
    data: CacheTypes[T],
    params: StringOrNumberArray,
  ): User | Cast {
    if (type === "user") {
      return this.setUserCachedData(data as User, params);
    }
    if (type === "cast") {
      return this.setCastCachedData(data as Cast, params);
    }
    //Add more cache types if needed
    throw new Error("Invalid cache type");
  }
}

type CacheConfig = {
  ttl: number;
};

export type CacheTypes = {
  user: User | UserWithOptionalViewerContext;
  cast: Cast;
};
export type CacheKeys = keyof CacheTypes;
