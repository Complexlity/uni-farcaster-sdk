import { Cache, type CacheKeys, type CacheTypes } from "@/lib/cache";
import { DEFAULTS } from "@/lib/constants";
import { LogLevel, Logger, Noop } from "@/lib/logger";
import type {
  Cast,
  Config,
  DataOrError,
  Service,
  User,
  UserWithOptionalViewerContext,
} from "@/lib/types";
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
  private retries: number = DEFAULTS.retries;
  constructor(config: Config) {
    const {
      activeServiceName,
      neynarApiKey,
      airstackApiKey,
      debug,
      logLevel,
      cacheTtl,
      retries,
    } = evaluateConfig(config);
    this.neynarApiKey = neynarApiKey;
    this.airstackApiKey = airstackApiKey;
    this.activeService = this.createService(activeServiceName);
    this.logLevel = logLevel;
    this.debug = debug;
    this.cache = new Cache({ ttl: cacheTtl });
    this.retries = retries;
    if (this.debug) {
      return new Proxy(this, {
        get(target, prop) {
          const propKey = prop.toString();
          const customMethods = ["neynar", "airstack"];
          const ignoredMethods = ["logger", "withCache", "createService"];

          // Get the original method or property
          //@ts-expect-error
          const originalMethod = target[propKey];

          // Check if the property is a function and should not be ignored
          if (typeof originalMethod === "function") {
            if (!ignoredMethods.includes(propKey)) {
              return async (...args: any[]) => {
                const loggedService = customMethods.includes(propKey)
                  ? { name: `custom` }
                  : target.activeService;
                const loggedArgs = customMethods.includes(propKey) ? "" : args;
                target
                  .logger(loggedService)
                  .info(
                    `${propKey}${
                      loggedArgs.length > 0 ? ` args: [${loggedArgs}]` : ""
                    } running...`,
                  );

                try {
                  let result;
                  if (
                    typeof originalMethod.apply === "function" &&
                    originalMethod.constructor.name === "AsyncFunction"
                  ) {
                    result = await originalMethod.apply(target, args);
                  } else {
                    result = originalMethod.apply(target, args);
                  }

                  if (result.error) {
                    target
                      .logger(loggedService)
                      .error(
                        `${propKey}:${
                          loggedArgs.length > 0 ? `, args: [${loggedArgs}]` : ""
                        } ${result.error.message} ❌`,
                      );
                  } else {
                    target
                      .logger(loggedService)
                      .success(
                        `${propKey}: ${
                          loggedArgs.length > 0 ? `, args: [${loggedArgs}]` : ""
                        } success ✅`,
                      );
                  }
                  return result;
                } catch (error) {
                  const loggedError =
                    error && typeof error === "object" && "message" in error
                      ? error.message
                      : JSON.stringify(error);
                  target
                    .logger(loggedService)
                    .error(
                      `${propKey}${
                        loggedArgs.length > 0 ? `, args: [${loggedArgs}]` : ""
                      } ${loggedError} ❌`,
                    );
                  throw error; // Re-throw the error after logging it
                }
              };
            } else {
              return (...args: any[]) => {
                return originalMethod.apply(target, args);
              };
            }
          }
          // If it's not a function or is in the ignore list, return the property value directly
          return originalMethod;
        },
      });
    }
  }

  // Add this helper method
  private async retryWrapper<T>(
    fn: (...args: any[]) => Promise<DataOrError<T>>,
    ...args: any[]
  ): Promise<DataOrError<T>> {
    let attempts = 0;
    while (attempts <= this.retries) {
      const result = await fn(...args);
      if (!result.error) {
        return result;
      }
      attempts++;
      if (attempts <= this.retries) {
        this.logger().warning(`Retry attempt ${attempts} of ${this.retries}`);
      }
    }
    return await fn(...args); // Return the last attempt result
  }

  private async withCache<T extends CacheKeys>(
    type: T,
    fn: (...args: any[]) => Promise<DataOrError<CacheTypes[T]>>,
    params: unknown[],
    thisArg?: Service,
  ) {
    //Don't log params of custom functions as they can be too large
    const description =
      type === "custom"
        ? `custom ${thisArg?.name || ""}`
        : `${fn.name} args: ${params.join(" ")}`;
    const cachedData = this.cache.get(type, params);
    if (cachedData) {
      this.logger({ name: "cache hit" }).success(`${description}`);
      return {
        data: cachedData,
        error: null,
      };
    }
    this.logger({ name: "cache miss" }).warning(`${description}`);
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
    variables: Record<string, unknown> = {},
  ) {
    if (!this.airstackApiKey) throw new Error("No airstack api key provided");
    const airstackService = new services.airstack(this.airstackApiKey);
    const res = await this.withCache(
      "custom",
      airstackService.customQuery<T>,
      [query, variables],
      airstackService,
    );
    return res;
  }

  public async neynar<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ) {
    if (!this.neynarApiKey) throw new Error("No neynar api key provided");
    const neynarService = new services.neynar(this.neynarApiKey);
    const res = await this.withCache(
      "custom",
      neynarService.customQuery<T>,
      [endpoint, params],
      neynarService,
    );
    return res;
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
    return this.retryWrapper(
      async () =>
        (await this.withCache("user", this.activeService.getUserByFid, [
          fid,
          viewerFid,
        ])) as DataOrError<User>,
      fid,
      viewerFid,
    );

    // const res = (await this.withCache(
    //   "user",
    //   this.activeService?.getUserByFid,
    //   [fid, viewerFid]
    // )) as DataOrError<User>;
    // return res;
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid,
  ) {
    return this.retryWrapper(
      async () =>
        (await this.withCache("user", this.activeService.getUserByUsername, [
          username,
          viewerFid,
        ])) as DataOrError<UserWithOptionalViewerContext>,
      username,
      viewerFid,
    );
    const res = await this.withCache(
      "user",
      this.activeService.getUserByUsername,
      [username, viewerFid],
    );
    return res;
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    let res: DataOrError<Cast>;
    if (!isValidHash) {
      res = { data: null, error: { message: "Invalid hash" } };
    } else {
      res = await this.retryWrapper(
        async () =>
          (await this.withCache("cast", this.activeService.getCastByHash, [
            hash,
            viewerFid,
          ])) as DataOrError<Cast>,
        hash,
        viewerFid,
      );
      // res = await this.withCache("cast", this.activeService?.getCastByHash, [
      //   hash,
      //   viewerFid,
      // ]);
    }
    return res;
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    return this.retryWrapper(
      async () =>
        (await this.withCache("cast", this.activeService.getCastByUrl, [
          url,
          viewerFid,
        ])) as DataOrError<Cast>,
      url,
      viewerFid,
    );
    // const res = await this.withCache("cast", this.activeService?.getCastByUrl, [
    //   url,
    //   viewerFid,
    // ]);
    // return res;
  }
}

function evaluateConfig(config: Config) {
  let activeServiceName: TService = "neynar";
  let airstackApiKey: string | undefined;
  let neynarApiKey: string | undefined;
  let debug = false;
  let logLevel: LogLevel | undefined = undefined;
  let cacheTtl: number = DEFAULTS.cacheTtl;
  let retries: number = DEFAULTS.retries;
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

  if (
    "retries" in config &&
    typeof config.retries === "number" &&
    config.retries >= 0
  ) {
    retries = config.retries;
  }

  return {
    activeServiceName,
    neynarApiKey,
    airstackApiKey,
    debug,
    logLevel,
    cacheTtl,
    retries,
  };
}

export default uniFarcasterSdk;
export * from "./lib/cache";
