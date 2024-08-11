import { DataOrError, Service, User } from "@/types";
import { TService } from "..";

export class hubService implements Service {
	public name: TService = "hub";
	private hubUrl: string;

	constructor(hubUrl: string) {
		this.hubUrl = hubUrl;
	}

	private async genericError() {
		return Promise.resolve({ data: null, error: new Error("Not implemented yet. Pleas provide a neynarApiKey or airstackApiKey in sdk config option") });
	}

	async getUserByFid(fid: number, viewerFid: number): Promise<DataOrError<User>> {
		return this.genericError()
	}
	async getUserByUsername(
		username: string,
		viewerFid: number
	) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	}
	async getCastByHash(hash: string, viewerFid: number) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	}

	async getCastByUrl(url: string, viewerFid: number) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	};
}