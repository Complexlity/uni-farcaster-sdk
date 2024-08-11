import { Config, Service } from "@/types";
import { services, TService, } from "./services";
import { isAddress } from "./utils";
import { DEFAULTS } from "./constants";


class uniFarcasterSdk implements Omit<Service, "name"> {
  private hubUrl: string = DEFAULTS.hubUrl;
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  private activeService: Service = new services.hub(this.hubUrl);

  constructor(config: Config) {
    this.hubUrl = config.hubUrl ?? this.hubUrl;
    this.neynarApiKey = config.neynarApiKey;
    this.airstackApiKey = config.airstackApiKey;
    this.activeService = this.createService(config.activeService);
  }

  //TODO: Make more composable
  private createService(service?: TService): Service {
    if (service === "neynar" && this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    } else if (service === "airstack" && this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    } else if(this.neynarApiKey) {
      return new services.neynar(this.neynarApiKey);
    }
    else if(this.airstackApiKey) {
      return new services.airstack(this.airstackApiKey);
    }
    else {
      return new services.hub(this.hubUrl);
    }
  }

  public getActiveService() {
    return this.activeService.name;
  }

  public setActiveService(service: TService) {
    this.activeService = this.createService(service);
  }

  public async getUserByFid(fid: number, viewerFid: number = DEFAULTS.fid) {
    return await this.activeService.getUserByFid(fid, viewerFid);
  }

  public async getUserByUsername(username: string, viewerFid: number = DEFAULTS.fid) {
    return await this.activeService.getUserByUsername(username, viewerFid);
  }

  public async getCastByHash(hash: string, viewerFid: number = DEFAULTS.fid) {
    const isValidHash = isAddress(hash);
    if (!isValidHash) {
      return { data: null, error: { message: "Invalid hash" } };
    }
    return await this.activeService.getCastByHash(hash, viewerFid);
  }

  public async getCastByUrl(url: string, viewerFid: number = DEFAULTS.fid) {
    return await this.activeService.getCastByUrl(url, viewerFid);
  }
}

export default uniFarcasterSdk;
