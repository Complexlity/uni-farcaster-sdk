// ------------------------------------

// GENERATED TYPES FOR AIRSTACK QUERIES

// ------------------------------------

export interface AirstackUserFetchResult {
  Socials: Socials;
  Following: Follow;
  Followedby: Follow;
}

export interface Follow {
  Following: any;
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
  isFarcasterPowerUser: boolean;
}

export interface ConnectedAddress {
  address: string;
  blockchain: string;
}

export interface UserAddressDetails {
  addresses: string[];
  blockchain: string;
}
