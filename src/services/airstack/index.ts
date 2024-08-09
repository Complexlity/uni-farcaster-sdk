import { Service } from "..";
import { User, Cast } from "../../playground";

export const airstackService: Service = {
  name: "airstack",

  async getUserByFid(fid: number, viewerFid: number): Promise<User> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  },

  async getUserByUsername(username: string, viewerFid: number): Promise<User> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  },

  async getCastByHash(hash: string, viewerFid: number): Promise<Cast> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  },

  async getCastByUrl(url: string, viewerFid: number): Promise<Cast> {
    return new Promise((resolve, reject) => {
      reject("Not implemented");
    });
  },
};
