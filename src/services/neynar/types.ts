// ------------------------------------

// GENERATED TYPES FOR NEYNAR QUERIES

// ------------------------------------

export interface CastFetchResult {
	cast: NeynarCast;
}

export interface NeynarCast {
	object: string;
	hash: string;
	thread_hash: string;
	parent_hash: null;
	parent_url: null;
	root_parent_url: null;
	parent_author: ParentAuthor;
	author: NeynarUser;
	text: string;
	timestamp: Date;
	embeds: unknown[];
	reactions: Reactions;
	replies: Replies;
	channel: NeynarChannel | null;
	mentioned_profiles: unknown[];
	viewer_context: CastViewerContext;
}

export interface NeynarChannel {
	object: string;
	id: string;
	name: string;
	image_url: string;
}

export interface NeynarUser {
	object: string;
	fid: number;
	custody_address: string;
	username: string;
	display_name: string;
	pfp_url: string;
	profile: Profile;
	follower_count: number;
	following_count: number;
	verifications: string[];
	verified_addresses: VerifiedAddresses;
	active_status: string;
	power_badge: boolean;
	viewer_context: AuthorViewerContext;
}

export interface Profile {
	bio: Bio;
}

export interface Bio {
	text: string;
}

export interface VerifiedAddresses {
	eth_addresses: string[];
	sol_addresses: string[];
}

export interface AuthorViewerContext {
	following: boolean;
	followed_by: boolean;
}

export interface ParentAuthor {
	fid: null;
}

export interface Reactions {
	likes_count: number;
	recasts_count: number;
	likes: Like[];
	recasts: Like[];
}

export interface Like {
	fid: number;
	fname: string;
}

export interface Replies {
	count: number;
}

export interface CastViewerContext {
	liked: boolean;
	recasted: boolean;
}

export interface NeynarV1User {
  fid: number;
  custodyAddress: string;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
  profile: {
    bio: {
      text: string;
    };
  };
  followerCount?: number;
  followingCount?: number;
  verifications?: string[];
  verifiedAddresses: {
    eth_addresses?: string[];
    sol_addresses?: string[];
  };
  activeStatus?: string;
  viewerContext: {
    following?: boolean;
    followedBy?: boolean;
  };
}