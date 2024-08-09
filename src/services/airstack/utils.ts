const socialReturnedQuery = `
			userId
			userAddress
			profileBio
      profileDisplayName
      profileName
      connectedAddresses {
        address
        blockchain
      }
      followerCount
      followingCount
      profileImage
      isFarcasterPowerUser`;

const castReturnedQuery = `
			embeds
      text
      channel {
        name
      }
			numberOfLikes
      numberOfRecasts
      castedBy {
				${socialReturnedQuery}
      }
	`;

export const userByFidQuery = (fid: number, viewerFid: number) => `query MyQuery {
  Socials(input: {filter: {userId: {_eq: "${fid}"}}, blockchain: ethereum}) {
    Social {
      ${socialReturnedQuery}
    }
  }
  Following: SocialFollowings(
    input: {filter: {dappName: {_eq: farcaster}, followingProfileId: {_eq: "${fid}"}, followerProfileId: {_eq: "${viewerFid}"}}, blockchain: ALL}
  ) {
    Following {
      followerProfileId
    }
  }
  Followedby: SocialFollowings(
    input: {filter: {dappName: {_eq: farcaster}, followingProfileId: {_eq: "${viewerFid}"}, followerProfileId: {_eq: "${fid}"}}, blockchain: ALL}
  ) {
    Following {
      followerProfileId
    }
  }
}`;

export const userByUsernameQuery = (username: string) =>
  `query MyQuery {
  Socials(
    input: {filter: {profileName: {_eq: "${username}"}}, blockchain: ethereum}
  ) {
    Social {
      ${socialReturnedQuery}
    }
  }
}`;

export const castByHashQuery = (castHash: string, viewerFid: number) =>
  `query FetchCastAuthorLikedByAndReactedBy {
  FarcasterCasts(
    input: {filter: {hash: {_eq: "${castHash}"}}, blockchain: ALL}
  ) {
    Cast {
			${castReturnedQuery}
    }
  }
  LikedBy: FarcasterReactions(
    input: {filter: {reactedBy: {_eq: "fc_fid:${viewerFid}"}, castHash: {_eq: "${castHash}"}, criteria: liked}, blockchain: ALL, limit: 1}
  ) {
    Reaction {
      reactedBy {
        userId
      }
    }
  }
  RecastedBy: FarcasterReactions(
    input: {filter: {reactedBy: {_eq: "fc_fid:${viewerFid}"}, castHash: {_eq: "${castHash}"}, criteria: recasted}, blockchain: ALL, limit: 1}
  ) {
    Reaction {
      reactedBy {
        userId
      }
    }
  }
}
`;
export const castByUrlQuery = (castUrl: string, viewerFid: number) =>
  `query FetchCastAuthorLikedByAndReactedBy {
  FarcasterCasts(
    input: {filter: {url: {_eq: "${castUrl}"}}, blockchain: ALL}
  )  {
    Cast {
			${castReturnedQuery}
    }
  }
  LikedBy: FarcasterReactions(
    input: {filter: {reactedBy: {_eq: "fc_fid:${viewerFid}"}, castUrl: {_eq: "${castUrl}"}, criteria: liked}, blockchain: ALL, limit: 1}
  ) {
    Reaction {
      reactedBy {
        userId
      }
    }
  }
  RecastedBy: FarcasterReactions(
    input: {filter: {reactedBy: {_eq: "fc_fid:${viewerFid}"}, castUrl: {_eq: "${castUrl}"}, criteria: recasted}, blockchain: ALL, limit: 1}
  ) {
    Reaction {
      reactedBy {
        userId
      }
    }
  }
}
`;