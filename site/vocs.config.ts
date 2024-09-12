import { defineConfig } from "vocs";

const version = "v0.0.25";

export default defineConfig({
  title: "UniFarcaster SDK",
  sidebar: [
    {
      text: "Getting Started",
      link: "/getting-started",
    },
    {
      text: "Configuration",
      link: "/configuration",
    },
    {
      text: "API Reference",
      link: "/api-reference",
    },
    {
      text: "Results and Errors",
      link: "/results-and-errors",
    },
  ],
  topNav: [
    { text: "Guides and API Reference", link: "/getting-started", match: "/" },
    {
      text: version,
      items: [
        {
          text: "Changelog",
          link: `https://github.com/Complexlity/uni-farcaster-sdk/blob/main/CHANGELOG.md`,
        },
        {
          text: "Contributing",
          link: "https://github.com/Complexlity/uni-farcaster-sdk/main/.github/CONTRIBUTING.md",
        },
      ],
    },
  ],
  socials: [
    {
      icon: "github",
      link: "https://github.com/Complexlity/uni-farcaster-sdk",
    },
    {
      icon: "warpcast",
      link: "https://warpcast.com/complexlity",
    },
  ],
});
