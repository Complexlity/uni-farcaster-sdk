
export const convertToV2User = (v1User: any): NeynarUser => {
  const v2User = {
    object: "user",
    fid: v1User.fid,
    custody_address: v1User.custodyAddress,
    username: v1User.username,
    display_name: v1User.displayName,
    pfp_url: v1User.pfp.url,
    profile: {
      bio: {
        text: v1User.profile.bio.text
      },
    },
    follower_count: v1User?.followerCount,
    following_count: v1User?.followingCount,
    verifications: v1User?.verifications,
    verified_addresses: {
      eth_addresses: v1User?.verifiedAddresses.eth_addresses,
      sol_addresses: v1User?.verifiedAddresses.sol_addresses,
    },
    active_status: v1User?.activeStatus === "active" ? "active" : "inactive",
    viewer_context: {
      following: v1User?.viewerContext.following,
      followed_by: v1User?.viewerContext.followedBy,
    },
  };
  return v2User as unknown as NeynarUser;
};


// ------------------------------------

// GENERATED TYPES FOR NEYNAR QUERIES

// ------------------------------------

export interface CastFetchResult {
  cast: NeynarCast;
}

export interface NeynarCast {
  object:             string;
  hash:               string;
  thread_hash:        string;
  parent_hash:        null;
  parent_url:         null;
  root_parent_url:    null;
  parent_author:      ParentAuthor;
  author:             NeynarUser;
  text:               string;
  timestamp:          Date;
  embeds:             any[];
  reactions:          Reactions;
  replies:            Replies;
  channel:            NeynarChannel | null;
  mentioned_profiles: any[];
  viewer_context:     CastViewerContext;
}

export interface NeynarChannel {
  object:             string;
  id:                 string;
  name:               string;
  image_url:          string;
}

export interface NeynarUser {
  object:             string;
  fid:                number;
  custody_address:    string;
  username:           string;
  display_name:       string;
  pfp_url:            string;
  profile:            Profile;
  follower_count:     number;
  following_count:    number;
  verifications:      string[];
  verified_addresses: VerifiedAddresses;
  active_status:      string;
  power_badge:        boolean;
  viewer_context:     AuthorViewerContext;
}

export interface Profile {
  bio: Bio;
}

export interface Bio {
  text: string;
}

export interface VerifiedAddresses {
  eth_addresses: string[];
  sol_addresses: any[];
}

export interface AuthorViewerContext {
  following:   boolean;
  followed_by: boolean;
}

export interface ParentAuthor {
  fid: null;
}

export interface Reactions {
  likes_count:   number;
  recasts_count: number;
  likes:         Like[];
  recasts:       Like[];
}

export interface Like {
  fid:   number;
  fname: string;
}

export interface Replies {
  count: number;
}

export interface CastViewerContext {
  liked:    boolean;
  recasted: boolean;
}
