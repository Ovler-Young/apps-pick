import { describe, expect, it } from "vitest";

import { createProxyURL, getProxyTarget, isProxySourcePath } from "../src/index";

describe("release proxy", () => {
  it("rewrites GitHub download URLs through the Worker", () => {
    const proxyURL = createProxyURL(
      "https://apps-pick.gcy.workers.dev",
      "https://github.com/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
    );

    expect(proxyURL).toBe(
      "https://apps-pick.gcy.workers.dev/proxy/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
    );
  });

  it("accepts the Source endpoint with or without a trailing slash", () => {
    expect(isProxySourcePath("/proxy")).toBe(true);
    expect(isProxySourcePath("/proxy/")).toBe(true);
    expect(isProxySourcePath("/proxy/owner/repo/releases/download/v1/app.ipa")).toBe(false);
  });

  it("only resolves release assets from configured repositories", () => {
    expect(
      getProxyTarget(
        "/proxy/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
    );
    expect(
      getProxyTarget("/proxy/example/other/releases/download/v1.0.0/app.ipa"),
    ).toBeUndefined();
  });
});
