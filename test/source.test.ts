import { afterEach, describe, expect, it, vi } from "vitest";

import worker from "../src/index";

const releases = [
  {
    name: "1.0.0",
    tag_name: "1.0.0",
    draft: false,
    prerelease: false,
    published_at: "2026-07-16T00:00:00Z",
    assets: [
      {
        name: "app.ipa",
        browser_download_url: "https://github.com/example/app/releases/download/1.0.0/app.ipa",
        size: 123,
        digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    ],
  },
];

function mockGitHubReleases(responseForRepo: (url: string) => Response) {
  vi.stubGlobal("caches", {
    default: {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  });
  const fetch = vi.fn((input: Request | string) =>
    Promise.resolve(responseForRepo(input instanceof Request ? input.url : input)),
  );
  vi.stubGlobal("fetch", fetch);

  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("source endpoint", () => {
  it("returns the available apps when one configured source fails", async () => {
    mockGitHubReleases((url) =>
      url.includes("czy0729/Bangumi")
        ? new Response("Unavailable", { status: 503 })
        : Response.json(releases),
    );

    const response = await worker.fetch(new Request("https://apps-pick.example/"), {});
    const source = (await response.json()) as {
      apps: { bundleIdentifier: string }[];
      featuredApps: string[];
    };

    expect(response.status).toBe(200);
    expect(source.apps).toHaveLength(11);
    expect(source.apps.map((app) => app.bundleIdentifier)).not.toContain("tv.bangumi.czy0729");
    expect(source.featuredApps).toEqual(source.apps.map((app) => app.bundleIdentifier));
  });

  it("returns 502 when no configured source can be loaded", async () => {
    mockGitHubReleases(() => new Response("Unavailable", { status: 503 }));

    const response = await worker.fetch(new Request("https://apps-pick.example/"), {});

    expect(response.status).toBe(502);
  });

  it("authenticates GitHub Releases API requests when a token is configured", async () => {
    const fetch = mockGitHubReleases(() => Response.json(releases));

    const response = await worker.fetch(new Request("https://apps-pick.example/"), {
      GITHUB_TOKEN: "test-token",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("test-token");
    expect(fetch).toHaveBeenCalledTimes(12);
    for (const [, init] of fetch.mock.calls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token");
    }
  });
});
