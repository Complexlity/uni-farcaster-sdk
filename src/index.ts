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
    //@ts-expect-error
    if (config.neynarApiKey && config.airstackApiKey) {
      //@ts-expect-error
      this.neynarApiKey = config.neynarApiKey;
      //@ts-expect-error
      this.airstackApiKey = config.airstackApiKey;
      //@ts-expect-error
      if (config.activeService) {
        //@ts-expect-error
        this.activeService = this.createService(config.activeService);
      } else {
        const randomIndex = Math.floor(
          Math.random() * Object.keys(services).length
        );
        const service = Object.keys(services)[randomIndex] as TService;
        this.activeService = this.createService(service);
      }
    }
    //@ts-expect-error
    else if (config.neynarApiKey) {
      //@ts-expect-error
      this.neynarApiKey = config.neynarApiKey;
      this.activeService = this.createService("neynar");
    }
    //@ts-expect-error
    else if (config.airstackApiKey) {
      //@ts-expect-error
      this.airstackApiKey = config.airstackApiKey;
      this.activeService = this.createService("airstack");
    } else {
      throw new Error(
        "You must provide either a neynarApiKey or airstackApiKey"
      );
    }
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

export default uniFarcasterSdk;
