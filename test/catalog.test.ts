import { describe, expect, it } from "vitest";

import { findIpaReleases, type GitHubRelease } from "../src/catalog";

const release = (name: string, assetName: string, options: Partial<GitHubRelease> = {}): GitHubRelease => ({
  name,
  tag_name: name,
  draft: false,
  prerelease: false,
  published_at: "2026-07-16T00:00:00Z",
  assets: [
    {
      name: assetName,
      browser_download_url: `https://example.test/${assetName}`,
      size: 123,
      digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
  ],
  ...options,
});

describe("findIpaReleases", () => {
  it("returns the latest five valid IPA releases and skips drafts, prereleases, and invalid assets", () => {
    const releases = [
      release("9.0.0", "app.ipa", { prerelease: true }),
      release("8.0.0", "app.apk"),
      release("7.0.0", "app.ipa", { draft: true }),
      release("2.1.0711", "ios0711.ipa"),
      release("2.1.0625", "ios0625.ipa"),
      release("2.1.0624", "ios0624.ipa"),
      release("2.1.0623", "ios0623.ipa"),
      release("2.1.0619", "ios0619.ipa"),
      release("2.1.0618", "ios0618.ipa"),
    ];

    const ipaReleases = findIpaReleases(releases);

    expect(ipaReleases).toHaveLength(5);
    expect(ipaReleases.map(({ version }) => version)).toEqual([
      "2.1.0711",
      "2.1.0625",
      "2.1.0624",
      "2.1.0623",
      "2.1.0619",
    ]);
  });
});
