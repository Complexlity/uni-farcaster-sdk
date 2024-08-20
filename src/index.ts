import {
  Cache,
  type CacheKeys,
  type CacheTypes,
  type StringOrNumberArray,
} from "@/lib/cache";
import { DEFAULTS } from "@/lib/constants";
import { LogLevel, Logger, Noop } from "@/lib/logger";
import type { Cast, Config, DataOrError, Service, User } from "@/lib/types";
import { isAddress } from "@/lib/utils";
import { type TService, services } from "@/services";

class uniFarcasterSdk implements Omit<Service, "name"> {
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  public name = "uniFarcasterSdk";
  private activeService: Service = new services.neynar("NEYNAR_API_DOCS");
  private debug = false;
  private logLevel: LogLevel | undefined;
  private cache: Cache = new Cache({ ttl: DEFAULTS.cacheTtl });
  constructor(config: Config) {
    const {
      activeServiceName,
      neynarApiKey,
      airstackApiKey,
      debug,
      logLevel,
      cacheTtl,
    } = evaluateConfig(config);
    this.neynarApiKey = neynarApiKey;
    this.airstackApiKey = airstackApiKey;
    this.activeService = this.createService(activeServiceName);
    this.logLevel = logLevel;
    this.debug = debug;
    this.cache = new Cache({ ttl: cacheTtl });
  }

  private async withCache<T extends CacheKeys>(
    type: T,

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    fn: (...args: any[]) => Promise<DataOrError<CacheTypes[T]>>,
    params: StringOrNumberArray,
  ) {
    const cachedData = this.cache.get(type, params);
    if (cachedData) {
      this.logger({ name: "cache hit" }).success(`${params.join(" ")}`);
      return {
        data: cachedData,
        error: null,
      };
    }
    this.logger({ name: "cache miss" }).error(`${params.join(" ")}`);
    const result = await fn.apply(this.activeService, params);
    const { data } = result;
    if (data) {
      //First params is the fid or username and we don't want to add that since we would get that from data
      const setParams = params.slice(1);
      this.cache.set(type, data, setParams);
    }
    return result;
  }

  private logger(service: { name: string } = { name: "main" }) {
    if (!this.debug) return new Noop();
    return new Logger(service.name, this.logLevel);
  }

  //TODO: Make more composable
  private createService(service?: TService): Service {
    if (service === "neynar" && this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    }
    if (service === "airstack" && this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    }
    if (this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    }
    if (this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    }
    throw new Error("No active service");
  }

  public getActiveService() {
    if (this.debug) {
      const logger = this.logger();
      logger.info(`active service: ${this.activeService?.name}`);
    }
    return this.activeService?.name;
  }

  public setActiveService(service: TService) {
    this.logger().info(`setting active to: ${service}`);
    this.activeService = this.createService(service);
    this.logger().info(`active service: ${this.activeService?.name}`);
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
    this.logger(this.activeService).info(
      `fetching user by fid: ${fid} ${
        viewerFid ? `and viewerFid: ${viewerFid}` : ""
      }`,
    );
    const res = (await this.withCache(
      "user",
      this.activeService?.getUserByFid,
      [fid, viewerFid],
    )) as DataOrError<User>;
    if (this.debug && res.error) {
      this.logger(this.activeService).error(
        `failed to fetch user by fid: ${fid} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    } else {
      this.logger(this.activeService).success(
        `fetched user by fid: ${fid} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    }
    return res;
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid,
  ) {
    this.logger(this.activeService).info(
      `fetching user by username: ${username} ${
        viewerFid ? `and viewerFid: ${viewerFid}` : ""
      }`,
    );
    if (this.activeService?.name === "airstack") {
      this.logger(this.activeService).warning(
        "viewer context is not returned when fetching by username with airstack. Fetch by fid instead or use neynar service",
      );
    }
    const res = await this.withCache(
      "user",
      this.activeService?.getUserByUsername,
      [username, viewerFid],
    );
    if (res.error) {
      this.logger(this.activeService).error(
        `failed to fetch user by username: ${username} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    } else {
      this.logger(this.activeService).success(
        `fetched user by username: ${username} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    }
    return res;
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    let res: DataOrError<Cast>;
    if (!isValidHash) {
      res = { data: null, error: { message: "Invalid hash" } };
    } else {
      res = await this.withCache("cast", this.activeService?.getCastByHash, [
        hash,
        viewerFid,
      ]);
    }
    if (res.error) {
      this.logger(this.activeService).error(
        `failed to fetch cast by hash: ${hash} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    } else {
      this.logger(this.activeService).success(
        `fetched cast by hash: ${hash} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    }
    return res;
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    this.logger(this.activeService).info(
      `fetching cast by url: ${url} ${
        viewerFid ? `and viewerFid: ${viewerFid}` : ""
      }`,
    );
    const res = await this.withCache("cast", this.activeService?.getCastByUrl, [
      url,
      viewerFid,
    ]);
    if (res.error) {
      this.logger(this.activeService).error(
        `failed to fetch cast by url: ${url} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    } else {
      this.logger(this.activeService).success(
        `fetched cast by url: ${url} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`,
      );
    }
    return res;
  }
}

function evaluateConfig(config: Config) {
  let activeServiceName: TService = "neynar";
  let airstackApiKey: string | undefined;
  let neynarApiKey: string | undefined;
  let debug = false;
  let logLevel: LogLevel | undefined = undefined;
  let cacheTtl: number = DEFAULTS.cacheTtl;
  if (
    "neynarApiKey" in config &&
    "airstackApiKey" in config &&
    config.neynarApiKey &&
    config.airstackApiKey
  ) {
    neynarApiKey = config.neynarApiKey;
    airstackApiKey = config.airstackApiKey;
    if (config.activeService) {
      activeServiceName = config.activeService;
    } else {
      const randomIndex = Math.floor(
        Math.random() * Object.keys(services).length,
      );
      const service = Object.keys(services)[randomIndex] as TService;

      activeServiceName = service;
    }
  } else if ("neynarApiKey" in config) {
    neynarApiKey = config.neynarApiKey;
    activeServiceName = "neynar";
  } else if (config.airstackApiKey) {
    airstackApiKey = config.airstackApiKey;
    activeServiceName = "airstack";
  } else {
    throw new Error("You must provide either a neynarApiKey or airstackApiKey");
  }
  if (config.debug) {
    debug = true;
    if ("logLevel" in config && config.logLevel) {
      if (LogLevel.includes(config.logLevel)) {
        logLevel = config.logLevel;
      }
    }
  }
  if ("cacheTtl" in config) {
    const tempTtl = Number(config.cacheTtl);
    if (!Number.isNaN(tempTtl) && tempTtl >= 0) {
      cacheTtl = tempTtl;
    }
  }

  return {
    activeServiceName,
    neynarApiKey,
    airstackApiKey,
    debug,
    logLevel,
    cacheTtl,
  };
}

export default uniFarcasterSdk;
export * from "./lib/cache";
