import type { DataOrError } from "@/lib/types";
import axios from "axios";
const AIRSTACK_ENDPOINT = "https://api.airstack.xyz/gql";

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
      profileImage`;

const castReturnedQuery = `
      url
      hash
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

export const usersByFidQuery = (fids: number[], viewerFid: number) => {
  const fidsString = fids.map((fid) => `"${fid}"`).join(",");
  return `query MyQuery {
    Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_in: [${fidsString}]}}, blockchain: ethereum}) {
      Social {
        ${socialReturnedQuery}
        }
        }
        Following: SocialFollowings(
          input: {filter: {dappName: {_eq: farcaster}, followingProfileId: {_in: [${fidsString}]}, followerProfileId: {_eq: "${viewerFid}"}}, blockchain: ALL}
          ) {
            Following {
              followingProfileId
              followerProfileId
              }
              }
              Followedby: SocialFollowings(
                input: {filter: {dappName: {_eq: farcaster}, followingProfileId: {_eq: "${viewerFid}"}, followerProfileId: {_in: [${fidsString}]}}, blockchain: ALL}
                ) {
                  Following {
                    followingProfileId
                    followerProfileId
                    }
                    }
                    }
                    `;
};

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

export async function _fetch<ResponseType>(
  authKey: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<DataOrError<ResponseType>> {
  try {
    const response = await axios({
      url: AIRSTACK_ENDPOINT,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authKey,
      },
      data: {
        query,
        variables,
      },
    });

    const data = response.data?.data;
    let error = null;

    if (response.data.errors || response.data.error) {
      error = response.data.errors || response.data.error;
    }
    return { data, error };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        data: null,
        error: { message: error.message || "Unable to fetch data" },
      };
    }
    return { data: null, error: { message: "An unexpected error occurred" } };
  }
}

export async function fetchGql<ResponseType>(
  authKey: string,
  query: string,
  variables: Record<string, unknown>,
) {
  return _fetch<ResponseType>(authKey, query, variables);
}

export async function fetchQuery<T>(
  authKey: string,
  query: string,
  variables = {},
): Promise<DataOrError<T>> {
  const { data, error } = await fetchGql<T>(authKey, query, variables);

  if (error) {
    return { data: null, error };
  }
  return { data, error: null };
}
