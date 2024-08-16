import { Cast, DataOrError, User, UserWithOptionalViewerContext } from "./types";

export type StringOrNumberArray = (string | number)[];

type MapData<T> = {
	data:T
	timestamp: number;
}

export class Cache {
	private cache = new Map<string, MapData<User | UserWithOptionalViewerContext | Cast>>();
	private ttl: number = 60 * 60 * 1000;
	constructor(config: CacheConfig = {}) {
		if (config.ttl) {
			this.ttl = config.ttl;
		}
	}

	private getData(key: string): User | UserWithOptionalViewerContext | Cast | null {
		const cachedData = this.cache.get(key);
		if (cachedData) {
			return cachedData.data;
		}
		return null;
	}

	private getUserCachedData(params: StringOrNumberArray): User |UserWithOptionalViewerContext | null {
		const cacheKey = `${["user", ...params].join(":")}`;
		return this.getData(cacheKey) as User |UserWithOptionalViewerContext | null;
	}

	private getCastCachedData(params: StringOrNumberArray): Cast
	| null {
		const cacheKey = `${["cast", ...params].join(":")}`;
		console.log({getCastCacheKey: cacheKey})
    return this.getData(cacheKey) as Cast | null;
  }

  private setUserCachedData(data: User, params: StringOrNumberArray): User {
    const fidKey = `${["user", data.fid, ...params].join(":")}`;
    const usernameKey = `${["user", data.username, ...params].join(":")}`;
		const setData = { data, timestamp: Date.now() };
		this.cache.set(fidKey, setData);
		this.cache.set(usernameKey, setData);
		return data
  }
  private setCastCachedData(data: Cast, params: StringOrNumberArray): Cast {
		const hashKey = `${["cast", data.hash, ...params].join(":")}`;
		const urlKey = `${["cast", data.url, ...params].join(":")}`;
		const setData = { data, timestamp: Date.now() };
    this.cache.set(hashKey, setData);
		this.cache.set(urlKey, setData);
		return data
  }

  public get<T extends CacheKeys>(type: T, params: StringOrNumberArray) {

    if (type === "user") {
      return this.getUserCachedData(params);
    }
    if (type === "cast") {
      return this.getCastCachedData(params);
    }
    //Add more cache types if needed
    throw new Error("Invalid cache type");
  }

  public set<T extends CacheKeys>(
    type: T,
    data: CacheTypes[T],
    params: StringOrNumberArray
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
  ttl?: number;
};

export interface CacheTypes {
  user: User | UserWithOptionalViewerContext;
  cast: Cast;
}
export type CacheKeys = keyof CacheTypes;

type P = CacheTypes[CacheKeys]
