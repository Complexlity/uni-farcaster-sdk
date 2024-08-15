import { Cast, Config, DataOrError, Service } from "@/types";
import { services, TService } from "@/services";
import { isAddress } from "@/utils";
import { DEFAULTS } from "@/constants";
import { Logger, LogLevel, Noop } from "@/logger";

class uniFarcasterSdk implements Omit<Service, "name"> {
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  public name = "uniFarcasterSdk";
  private activeService: Service | undefined;
  private debug: boolean = false;
  private logLevel: LogLevel | undefined;
  constructor(config: Config) {
    const { activeServiceName, neynarApiKey, airstackApiKey, debug, logLevel } =
      evaluateConfig(config);
    this.neynarApiKey = neynarApiKey;
    this.airstackApiKey = airstackApiKey;
    this.activeService = this.createService(activeServiceName);
    this.logLevel = logLevel;
    this.debug = debug;
  }

  private logger(service: { name: string } = { name: "Main" }) {
    if(!this.debug) return new Noop();
    return new Logger(service.name, this.logLevel);
  }

  //TODO: Make more composable
  private createService(service?: TService): Service {
    if (service === "neynar" && this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    } else if (service === "airstack" && this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    } else if (this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    } else if (this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    } else {
      throw new Error("No active service");
    }
  }

  public getActiveService() {
    if (this.debug) {
      const logger = this.logger();
      logger.info("Active service: " + this.activeService!.name);
    }
    return this.activeService!.name;
  }

  public setActiveService(service: TService) {
      this.logger().info(`setting Active to: ${service}`);
    this.activeService = this.createService(service);
      this.logger().info(`active service: ${this.activeService!.name}`);
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
      this.logger(this.activeService!).info(
        `fetching user by fid: ${fid} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    const res = await this.activeService!.getUserByFid(fid, viewerFid);
    if (this.debug && res.error) {
      this.logger(this.activeService!).error(
        `failed to fetch user by fid: ${fid} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    } else {
      this.logger(this.activeService!).success(
        `fetched user by fid: ${fid} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    }
    return res;
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid
  ) {

      this.logger(this.activeService!).info(
        `fetching user by username: ${username} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
      if (this.activeService!.name === "airstack") {
        this.logger(this.activeService!).warning(
          "viewer context is not returned when fetching by username with airstack. Fetch by fid instead or use neynar service"
        );
    }
    const res = await this.activeService!.getUserByUsername(
      username,
      viewerFid
    );
    if (res.error) {
      this.logger(this.activeService!).error(
        `Failed to fetch user by username: ${username} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    } else {
      this.logger(this.activeService!).success(
        `Fetched user by username: ${username} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    }
    return res;
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    let res: DataOrError<Cast>;
    if (!isValidHash) {
      res = { data: null, error: { message: "Invalid hash" } };
    } else res = await this.activeService!.getCastByHash(hash, viewerFid);
    if (res.error) {
      this.logger(this.activeService!).error(
        `failed to fetch cast by hash: ${hash} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    } else {
      this.logger(this.activeService!).success(
        `fetched cast by hash: ${hash} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    }
    return res;
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
      this.logger(this.activeService!).info(
        `fetching cast by url: ${url} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    const res = await this.activeService!.getCastByUrl(url, viewerFid);
    if (res.error) {
      this.logger(this.activeService!).error(
        `failed to fetch cast by url: ${url} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    } else {
      this.logger(this.activeService!).success(
        `fetched cast by url: ${url} ${
          viewerFid ? `and viewerFid: ${viewerFid}` : ""
        }`
      );
    }
    return res;
  }
}

function evaluateConfig(config: Config) {
  let activeServiceName: TService = "neynar";
  let airstackApiKey: string | undefined;
  let neynarApiKey: string | undefined;
  let debug: boolean = false;
  let logLevel: LogLevel | undefined = undefined;
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

  return { activeServiceName, neynarApiKey, airstackApiKey, debug, logLevel };
}

export default uniFarcasterSdk;
