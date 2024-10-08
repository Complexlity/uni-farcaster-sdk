// ------------------------------------

// GENERATED TYPES FOR AIRSTACK QUERIES

// ------------------------------------

/*
USER QUERIES
*/
export interface AirstackUserQueryResult {
  Socials: Socials;
  Following: Follow;
  Followedby: Follow;
}

export interface Follow {
  Following:
    | {
        followingProfileId: string;
        followerProfileId: string;
      }[]
    | null;
}

export interface Socials {
  Social: Social[];
}

export interface Social {
  userId: string;
  userAddress: string;
  profileDisplayName: string;
  profileName: string;
  connectedAddresses: ConnectedAddress[];
  followerCount: number;
  followingCount: number;
  profileImage: string;
  profileBio: string;
}

export interface ConnectedAddress {
  address: string;
  blockchain: string;
}

export interface UserAddressDetails {
  addresses: string[];
  blockchain: string;
}

/*
CAST QUERIES
*/

export interface AirstackCastQueryResult {
  FarcasterCasts: FarcasterCasts;
  LikedBy: Reactions;
  RecastedBy: Reactions;
}

export interface FarcasterCasts {
  Cast: Cast[];
}

export interface Cast {
  embeds: unknown[];
  text: string;
  channel: Channel;
  numberOfLikes: number;
  numberOfRecasts: number;
  castedBy: CastedBy;
  url: string;
  hash: string;
}

export interface CastedBy {
  userId: string;
  userAddress: string;
  profileBio: string;
  profileDisplayName: string;
  profileName: string;
  connectedAddresses: ConnectedAddress[];
  followerCount: number;
  followingCount: number;
  profileImage: string;
}

export interface ConnectedAddress {
  address: string;
  blockchain: string;
}

export interface Channel {
  name: string;
}

export interface Reactions {
  Reaction: null;
}
