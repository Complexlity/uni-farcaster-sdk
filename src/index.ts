import { Cache, type CacheKeys, type CacheTypes } from "@/lib/cache";
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
    if (this.debug) {
      return new Proxy(this, {
        get(target, prop) {
          const propKey = prop.toString();
          const ignoreMethods = [
            "logger",
            "withCache",
            "createService",
            "neynar",
            "airstack",
          ];

          // Get the original method or property
          //@ts-expect-error
          const originalMethod = target[propKey];

          // Check if the property is a function and should not be ignored
          if (
            typeof originalMethod === "function" &&
            !ignoreMethods.includes(propKey)
          ) {
            return (...args: any[]) => {
              target
                .logger(target.activeService)
                .info(
                  `${propKey}${
                    args.length > 0 ? ` args: [${args}]` : ""
                  } running...`
                );

              try {
                const result = originalMethod.apply(target, args);
                if (result.error) {
                  target
                    .logger(target.activeService)
                    .error(
                      `${propKey}${
                        args.length > 0 ? `, args: [${args}]` : ""
                      } erorr ❌`
                    );
                } else {
                  target
                    .logger(target.activeService)
                    .success(
                      `${propKey}${
                        args.length > 0 ? `, args: [${args}]` : ""
                      } success ✅`
                    );
                }
                return result;
              } catch (error) {
                target
                  .logger(target.activeService)
                  .error(
                    `${propKey}${
                      args.length > 0 ? `, args: [${args}]` : ""
                    } erorr ❌`
                  );
                throw error; // Re-throw the error after logging it
              }
            };
          } else if (typeof originalMethod === "function") {
            return (...args: any[]) => {
              return originalMethod.apply(target, args);
            };
          }
          // If it's not a function or is in the ignore list, return the property value directly
          return originalMethod;
        },
      });
    }
  }

  private async withCache<T extends CacheKeys>(
    type: T,
    fn: (...args: any[]) => Promise<DataOrError<CacheTypes[T]>>,
    params: unknown[],
    thisArg?: any
  ) {
    const cachedData = this.cache.get(type, params);
    if (cachedData) {
      this.logger({ name: "cache hit" }).success(`args: ${params.join(" ")}`);
      return {
        data: cachedData,
        error: null,
      };
    }
    this.logger({ name: "cache miss" }).error(`args: ${params.join(" ")}`);
    const result = await fn.apply(thisArg || this.activeService, params);
    const { data } = result;
    if (data) {
      //First params is the fid or username and we don't want to add that since we would get that from data
      const setParams = type === "custom" ? params : params.slice(1);
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
    return this.activeService?.name;
  }

  public setActiveService(service: TService) {
    this.activeService = this.createService(service);
  }

  public async airstack<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {}
  ) {
    if (!this.airstackApiKey) throw new Error("No airstack api key provided");
    const airstackService = new services.airstack(this.airstackApiKey);
    const res = await this.withCache(
      "custom",
      airstackService.customQuery<T>,
      [query, variables],
      airstackService
    );
    return res;
  }

  public async neynar<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ) {
    if (!this.neynarApiKey) throw new Error("No neynar api key provided");
    const neynarService = new services.neynar(this.neynarApiKey);
    const res = await this.withCache(
      "custom",
      neynarService.customQuery<T>,
      [endpoint, params],
      neynarService
    );
    return res;
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
    const res = (await this.withCache(
      "user",
      this.activeService?.getUserByFid,
      [fid, viewerFid]
    )) as DataOrError<User>;
    return res;
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid
  ) {
    const res = await this.withCache(
      "user",
      this.activeService?.getUserByUsername,
      [username, viewerFid]
    );
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
    return res;
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    const res = await this.withCache("cast", this.activeService?.getCastByUrl, [
      url,
      viewerFid,
    ]);
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
        Math.random() * Object.keys(services).length
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
