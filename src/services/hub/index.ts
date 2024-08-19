import type { DataOrError, Service, User } from "@/lib/types";
import type { TService } from "@/services";

export class hubService implements Service {
	//@ts-expect-error: Deprecate hub service
	public name: TService = "hub";
	private hubUrl: string;

	constructor(hubUrl: string) {
		if (!hubUrl) {
			throw new Error(
				"Attempt to use an authenticated hub without first providing an hub url",
			);
		}
		this.hubUrl = hubUrl;
	}

	private async genericError() {
		return Promise.resolve({
			data: null,
			error: new Error(
				"Not implemented yet. Pleas provide a neynarApiKey or airstackApiKey in sdk config option",
			),
		});
	}

	async getUserByFid(
		fid: number,
		viewerFid: number,
	): Promise<DataOrError<User>> {
		return this.genericError();
	}
	async getUserByUsername(username: string, viewerFid: number) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	}
	async getCastByHash(hash: string, viewerFid: number) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	}

	async getCastByUrl(url: string, viewerFid: number) {
		return Promise.resolve({ data: null, error: new Error("Not implemented") });
	}
}
