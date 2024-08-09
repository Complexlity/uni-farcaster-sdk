import { User, Cast } from "./playground";
import { services, TService, Service } from "./services";
type Config = {
  hubUrl?: string;
  neynarApiKey?: string;
  airstackApiKey?: string;
  activeService?: TService;
};

class uniFarcasterSdk {
  private hubUrl: string = "DEFAULT_HUB_URL";
  private neynarApiKey: string | undefined;
  private airstackApiKey: string | undefined;
  private activeService: Service = services.hub;

  constructor(config: Config) {
    this.hubUrl = config.hubUrl ?? "DEFAULT_HUB_URL";
    this.neynarApiKey = config.neynarApiKey;
    this.airstackApiKey = config.airstackApiKey;
    this.activeService = this.getActiveService(config.activeService);
  }

  //TODO: Make more composable
  private getActiveService(service?: TService): Service {
    if (service === "neynar" && this.neynarApiKey) {
      return services.neynar;
    } else if (service === "airstack" && this.airstackApiKey) {
      return services.airstack;
    } else {
      return services.hub;
    }
  }

  public getUserByFid(fid: number, viewerFid: number): User {
    return this.activeService.getUserByFid(fid, viewerFid);
  }

  public getUserByUsername(username: string, viewerFid: number): User {
    return this.activeService.getUserByUsername(username, viewerFid);
  }

  public getCastByHash(hash: string, viewerFid: number): Cast {
    return this.activeService.getCastByHash(hash, viewerFid);
  }

  public getCastByUrl(url: string, viewerFid: number): Cast {
    return this.activeService.getCastByUrl(url, viewerFid);
  }
}

export default uniFarcasterSdk;
