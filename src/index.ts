import { Config, Service } from "@/types";
import { services, TService, } from "./services";


class uniFarcasterSdk implements Omit<Service, "name"> {
  private hubUrl: string = "DEFAULT_HUB_URL";
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  private activeService = new services.hub(this.hubUrl);

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

  public async getUserByFid(fid: number, viewerFid: number) {
    return await this.activeService.getUserByFid(fid, viewerFid);
  }

  public getUserByUsername(username: string) {
    return this.activeService.getUserByUsername(username);
  }

  public getCastByHash(hash: string, viewerFid: number) {
    return this.activeService.getCastByHash(hash, viewerFid);
  }

  public getCastByUrl(url: string, viewerFid: number) {
    return this.activeService.getCastByUrl(url, viewerFid);
  }
}

export default uniFarcasterSdk;
