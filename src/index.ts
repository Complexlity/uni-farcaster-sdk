import { Config, Service } from "@/types";
import { services, TService } from "@/services";
import { isAddress } from "@/utils";
import { DEFAULTS } from "@/constants";



class uniFarcasterSdk implements Omit<Service, "name"> {
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  public name = "uniFarcasterSdk";
  private activeService: Service | undefined;

  constructor(config: Config) {
    const { activeServiceName, neynarApiKey, airstackApiKey } = evaluateConfig(config);
    this.neynarApiKey = neynarApiKey;
    this.airstackApiKey = airstackApiKey;
    this.activeService = this.createService(activeServiceName);
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
    return this.activeService!.name;
  }

  public setActiveService(service: TService) {
    this.activeService = this.createService(service);
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
    return await this.activeService!.getUserByFid(fid, viewerFid);
  }

  public async getUserByUsername(
    username: string,
    viewerFid: number = DEFAULTS.fid
  ) {
    if (!this.activeService) {
      throw new Error("No active service");
    }
    return await this.activeService.getUserByUsername(username, viewerFid);
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    if (!isValidHash) {
      return { data: null, error: { message: "Invalid hash" } };
    }

    return await this.activeService!.getCastByHash(hash, viewerFid);
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    if (!this.activeService) {
      throw new Error("No active service");
    }
    return await this.activeService!.getCastByUrl(url, viewerFid);
  }
}


function evaluateConfig(config: Config) {
  let activeServiceName: TService = "neynar";
  let airstackApiKey: string | undefined;
  let neynarApiKey: string | undefined;
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
  return { activeServiceName, neynarApiKey, airstackApiKey };
}

export default uniFarcasterSdk;
