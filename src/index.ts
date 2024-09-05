import { Cache, type CacheKeys, type CacheTypes } from "@/lib/cache";
import { DEFAULTS } from "@/lib/constants";
import { LogLevel, Logger, Noop } from "@/lib/logger";
import type {
  Cast,
  Config,
  DataOrError,
  RetryStrategy,
  Service,
  User,
} from "@/lib/types";
import { isAddress } from "@/lib/utils";
import { type TService, services } from "@/services";

class uniFarcasterSdk implements Omit<Service, "name" | "customQuery"> {
  private neynarApiKey: string = DEFAULTS.neynarApiKey;
  private airstackApiKey: string | undefined;
  public name = "uniFarcasterSdk";
  private activeService: Service = new services.neynar(this.neynarApiKey);
  private debug = false;
  private logLevel: LogLevel | undefined;
  private cache: Cache = new Cache({ ttl: DEFAULTS.cacheTtl });
  private retries: number = DEFAULTS.retries;
  private retryStrategy: RetryStrategy = "normal";
  private possibleServices: TService[] = [];
  constructor(config?: Config) {
    const {
      activeServiceName,
      neynarApiKey,
      airstackApiKey,
      debug,
      logLevel,
      cacheTtl,
      retries,
      retryStrategy,
      possibleServices,
    } = evaluateConfig(config);
    this.neynarApiKey = neynarApiKey;
    this.airstackApiKey = airstackApiKey;
    this.activeService = this.createService(activeServiceName);
    this.logLevel = logLevel;
    this.debug = debug;
    this.cache = new Cache({ ttl: cacheTtl });
    this.retries = retries;
    this.retryStrategy = retryStrategy;
    this.possibleServices = possibleServices;
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

                  if (result && result.error) {
                    const loggedService = customMethods.includes(propKey)
                      ? { name: `custom` }
                      : target.activeService;
                    target
                      .logger(loggedService)
                      .error(
                        `${propKey}:${
                          loggedArgs.length > 0 ? `, args: [${loggedArgs}]` : ""
                        } ${result.error.message} ❌`,
                      );
                  } else {
                    const loggedService = customMethods.includes(propKey)
                      ? { name: `custom` }
                      : target.activeService;
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
                  const loggedService = customMethods.includes(propKey)
                    ? { name: `custom` }
                    : target.activeService;
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

  private async retryWrapper<T extends CacheKeys>(
    type: T,
    // fn: (...args: any[]) => Promise<DataOrError<CacheTypes[T]>>,
    fnName: keyof Service,
    params: any[],
    thisArg?: Service,
  ): Promise<DataOrError<CacheTypes[T]>> {
    let attempts = 0;
    let result: DataOrError<CacheTypes[T]> = {
      data: null,
      error: { message: "Something went wrong. Please try again later." },
    };
    const originalService = this.activeService;
    let possibleServices = this.possibleServices.filter(
      (service) => service !== originalService.name,
    );
    while (attempts <= this.retries) {
      const serviceCalller = thisArg || this.activeService;

      const fn = serviceCalller[fnName] as (
        ...args: any[]
      ) => Promise<DataOrError<CacheTypes[T]>>;
      result = await fn.apply(serviceCalller, params);

      if (!result.error) {
        //Also revert to the initial service if we are using switchTemp
        if (
          this.retryStrategy === "switchTemp" &&
          this.possibleServices.length > 1
        ) {
          this.activeService = originalService;
          this.logger({ name: "switch" }).info(
            `reverted back to ${originalService.name}`,
          );
        }

        return result;
      }

      if (attempts === this.retries) {
        break;
      }

      if (
        this.retryStrategy.includes("switch") &&
        type !== "custom" &&
        this.possibleServices.length > 1
      ) {
        if (possibleServices.length === 0) {
          const otherServices = this.possibleServices.filter(
            (service) => service !== originalService.name,
          );
          possibleServices = [originalService.name, ...otherServices];
        }
        const nextService = possibleServices.shift() as TService;
        this.setActiveService(nextService);
        this.logger({ name: "switch" }).info(
          `switched to ${nextService} service for retry`,
        );
      }
      attempts++;
      this.logger({ name: "retrying..." }).warning(
        `attempt ${attempts} of ${this.retries}`,
      );
    }

    if (
      this.retryStrategy === "switchTemp" &&
      this.possibleServices.length > 1
    ) {
      this.activeService = originalService;
      this.logger({ name: "switch" }).info(
        `reverted back to ${originalService.name}`,
      );
    }
    return result;
  }

  private async withCache<T extends CacheKeys>(
    type: T,
    fn: keyof Service,
    params: unknown[],
    thisArg?: Service,
  ) {
    //Don't log params of custom functions as they can be too large
    const description =
      type === "custom"
        ? `custom ${thisArg?.name || ""}`
        : `${fn} args: ${params.join(" ")}`;
    const cachedData = this.cache.get(type, params);
    if (cachedData) {
      this.logger({ name: "cache hit" }).success(`${description}`);
      return {
        data: cachedData,
        error: null,
      };
    }
    this.logger({ name: "cache miss" }).warning(`${description}`);
    const result = await this.retryWrapper(
      type,
      fn,
      params,
      thisArg || undefined,
    );
    const { data } = result;
    if (data) {
      //First params is the either hash or url and we don't want to add that since we would get that from data
      const setParams = type === "cast" ? params.slice(1) : params;
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
    return this.activeService.name;
  }

  public setActiveService(service: TService) {
    this.activeService = this.createService(service);
  }

  public async airstack<R = unknown>(
    query: string,
    variables: Record<string, unknown> = {},
  ) {
    if (!this.airstackApiKey) throw new Error("No airstack api key provided");
    const airstackService = new services.airstack(this.airstackApiKey);
    return (await this.withCache(
      "custom",
      "customQuery",
      [query, variables],
      airstackService,
    )) as DataOrError<R>;
  }

  public async neynar<R = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ) {
    const neynarService = new services.neynar(this.neynarApiKey);

    return (await this.withCache(
      "custom",
      "customQuery",
      [endpoint, params],
      neynarService,
    )) as DataOrError<R>;
  }

  public async getUsersByFid(fids: number[], viewerFid: number = DEFAULTS.fid) {
    const res = (await this.withCache("fid", "getUsersByFid", [
      fids,
      viewerFid,
    ])) as DataOrError<User[]>;
    return res;
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid,
  ) {
    const res = await this.withCache("username", "getUserByUsername", [
      username,
      viewerFid,
    ]);
    return res;
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    let res: DataOrError<Cast>;
    if (!isValidHash) {
      res = { data: null, error: { message: "Invalid hash" } };
    } else {
      res = await this.withCache("cast", "getCastByHash", [hash, viewerFid]);
    }
    return res;
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    /* Airstack only support top level casts by url so always only use neynar for query for this */
    const currentService = this.activeService.name;

    if (currentService === "airstack") {
      this.activeService = this.createService("neynar");
    }
    const res = await this.withCache("cast", "getCastByUrl", [url, viewerFid]);

    if (currentService === "airstack") {
      this.activeService = this.createService(currentService);
    }
    return res;
  }
}

function evaluateConfig(config?: Config) {
  let activeServiceName: TService = "neynar";
  let airstackApiKey: string | undefined;
  let neynarApiKey: string = DEFAULTS.neynarApiKey;
  let debug = false;
  let logLevel: LogLevel | undefined = undefined;
  let cacheTtl: number = DEFAULTS.cacheTtl;
  let retries: number = DEFAULTS.retries;
  let retryStrategy: RetryStrategy = "normal";
  let possibleServices: TService[] = [];

  if (config) {
    if (
      "neynarApiKey" in config &&
      "airstackApiKey" in config &&
      config.neynarApiKey &&
      config.airstackApiKey
    ) {
      neynarApiKey = config.neynarApiKey;
      airstackApiKey = config.airstackApiKey;
      possibleServices = ["neynar", "airstack"];
      if (config.activeService) {
        activeServiceName = config.activeService;
      } else {
        const randomIndex = Math.floor(
          Math.random() * Object.keys(services).length,
        );
        const service = Object.keys(services)[randomIndex] as TService;

        activeServiceName = service;
      }
    } else if ("neynarApiKey" in config && config.neynarApiKey) {
      neynarApiKey = config.neynarApiKey;
      activeServiceName = "neynar";
      possibleServices = ["neynar"];
    } else if (config.airstackApiKey) {
      airstackApiKey = config.airstackApiKey;
      activeServiceName = "airstack";
      possibleServices = ["airstack"];
    } else {
      //
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
    if ("retryStrategy" in config && config.retryStrategy) {
      retryStrategy = config.retryStrategy;
    }
  }

  return {
    activeServiceName,
    neynarApiKey,
    airstackApiKey,
    debug,
    logLevel,
    cacheTtl,
    retries,
    retryStrategy,
    possibleServices,
  };
}

export default uniFarcasterSdk;
export * from "./lib/cache";
