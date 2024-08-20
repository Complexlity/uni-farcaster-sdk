import type { NeynarUser, NeynarV1User } from "./types";

export const convertToV2User = (v1User: NeynarV1User): NeynarUser => {
  const v2User = {
    object: "user",
    fid: v1User.fid,
    custody_address: v1User.custodyAddress,
    username: v1User.username,
    display_name: v1User.displayName,
    pfp_url: v1User.pfp.url,
    profile: {
      bio: {
        text: v1User.profile.bio.text,
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
