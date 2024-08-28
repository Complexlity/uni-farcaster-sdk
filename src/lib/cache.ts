import { DEFAULTS } from "./constants";
import type { Cast, User, UserWithOptionalViewerContext } from "./types";

export type UnknownArray = unknown[];

type MapData<T> = {
  data: T;
  timestamp: number;
};

export class Cache {
  private cache = new Map<
    string,
    MapData<User | UserWithOptionalViewerContext | Cast | unknown>
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
      //Cache is expired. Delete it
      this.cache.delete(key);
    }
    return null;
  }

  private getUserCachedData(params: UnknownArray) {
    const cacheKey = `${["user", ...params].join(":")}`;
    return this.getData<User | UserWithOptionalViewerContext>(cacheKey);
  }

  private getCastCachedData(params: UnknownArray) {
    const cacheKey = `${["cast", ...params].join(":")}`;

    return this.getData<Cast>(cacheKey) as Cast | null;
  }

  private getCustomCachedData(params: any[]) {
    const cacheKey = `${["custom", ...params].join(":")}`;
    return this.getData<unknown>(cacheKey) as unknown | null;
  }
  private setUserCachedData(data: User, params: UnknownArray) {
    const fidKey = `${["user", data.fid, ...params].join(":")}`;
    const usernameKey = `${["user", data.username, ...params].join(":")}`;
    const setData = { data, timestamp: Date.now() };
    this.cache.set(fidKey, setData);
    this.cache.set(usernameKey, setData);
    return data;
  }
  private setCastCachedData(data: Cast, params: UnknownArray): Cast {
    const hashKey = `${["cast", data.hash, ...params].join(":")}`;
    const urlKey = `${["cast", data.url, ...params].join(":")}`;
    const setData = { data, timestamp: Date.now() };
    this.cache.set(hashKey, setData);
    this.cache.set(urlKey, setData);
    return data;
  }

  private setCustomCachedData(data: unknown, params: any[]) {
    const cacheKey = `${["custom", ...params].join(":")}`;
    const setData = { data, timestamp: Date.now() };
    this.cache.set(cacheKey, setData);
    return data;
  }

  public get<T extends CacheKeys>(type: T, params: UnknownArray) {
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
    if (type === "custom") {
      const striginfiedParams = params.map((param) => JSON.stringify(param));
      return this.getCustomCachedData(striginfiedParams) as T extends "custom"
        ? unknown | null
        : never;
    }
    //Add more cache types if more queries are added
    throw new Error("Invalid cache type");
  }

  public set<T extends CacheKeys>(
    type: T,
    data: CacheTypes[T],
    params: UnknownArray,
  ): User | Cast | unknown {
    if (type === "user") {
      return this.setUserCachedData(data as User, params);
    }
    if (type === "cast") {
      return this.setCastCachedData(data as Cast, params);
    }
    if (type === "custom") {
      const striginfiedParams = params.map((param) => JSON.stringify(param));
      return this.setCustomCachedData(data as unknown, striginfiedParams);
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
  custom: any;
};
export type CacheKeys = keyof CacheTypes;
