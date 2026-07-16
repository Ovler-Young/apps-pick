import { findIpaReleases, type GitHubRelease } from "./catalog";

interface AppConfig {
  bundleIdentifier: string;
  category: string;
  developerName: string;
  iconURL: string;
  localizedDescription: string;
  minOSVersion: string;
  name: string;
  repo: string;
  subtitle: string;
  tintColor: string;
}

interface AppVersion {
  buildVersion: string;
  date: string;
  downloadURL: string;
  localizedDescription: string;
  marketingVersion: string;
  minOSVersion: string;
  sha256?: string;
  size: number;
  version: string;
}

const BANGUMI_ICON =
  "https://raw.githubusercontent.com/czy0729/Bangumi/master/ios/Bangumi/Images.xcassets/AppIcon.appiconset/ItunesArtwork%402x.png";

const APPS: AppConfig[] = [
  {
    name: "Bangumi",
    bundleIdentifier: "tv.bangumi.czy0729",
    developerName: "czy0729",
    subtitle: "Bangumi 番组计划第三方客户端",
    localizedDescription: "IPA 来自 GitHub Actions 自动构建，未签名，需由侧载工具签名安装。",
    iconURL: BANGUMI_ICON,
    tintColor: "#F09199",
    category: "entertainment",
    repo: "czy0729/Bangumi",
    minOSVersion: "15.1",
  },
  {
    name: "轻悦时光",
    bundleIdentifier: "com.autobcb.qysg",
    developerName: "autobcb",
    subtitle: "多平台阅读软件",
    localizedDescription: "IPA 来自 qysg GitHub Releases，需由侧载工具签名安装。",
    iconURL: "https://github.com/autobcb.png",
    tintColor: "#4C9A8B",
    category: "books",
    repo: "autobcb/qysg",
    minOSVersion: "15.0",
  },
];

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      return json({ error: "Not found" }, 404, 0);
    }

    try {
      const apps = await Promise.all(APPS.map(toApp));

      return json(
        {
          name: "Oliver's Apps Pick",
          subtitle: "Curated unsigned IPA releases",
          description: "Oliver的Apps Pick，收录不局限于目前的 Bangumi。",
          iconURL: BANGUMI_ICON,
          headerURL: BANGUMI_ICON,
          website: "https://github.com/Ovler-Young/apps-pick",
          tintColor: "#F09199",
          featuredApps: APPS.map((app) => app.bundleIdentifier),
          apps,
          news: [],
        },
        200,
        900,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ error: message }, 502, 0);
    }
  },
};

async function toApp(app: AppConfig) {
  return {
    name: app.name,
    bundleIdentifier: app.bundleIdentifier,
    developerName: app.developerName,
    subtitle: app.subtitle,
    localizedDescription: app.localizedDescription,
    iconURL: app.iconURL,
    tintColor: app.tintColor,
    category: app.category,
    versions: await getVersions(app),
  };
}

async function getVersions(app: AppConfig): Promise<AppVersion[]> {
  const releases = await fetchJSON<GitHubRelease[]>(
    `https://api.github.com/repos/${app.repo}/releases?per_page=30`,
  );
  const ipaReleases = findIpaReleases(releases);

  if (ipaReleases.length === 0) {
    throw new Error(`No IPA releases found for ${app.repo}`);
  }

  return Promise.all(
    ipaReleases.map(async ({ ipa, release, shaFile, version }) => ({
      version,
      buildVersion: "1",
      marketingVersion: version,
      date: release.published_at,
      localizedDescription: `Release ${version} from ${app.repo}.`,
      downloadURL: ipa.browser_download_url,
      size: ipa.size,
      sha256: getDigest(ipa.digest) ?? (shaFile ? await fetchSHA256(shaFile.browser_download_url) : undefined),
      minOSVersion: app.minOSVersion,
    })),
  );
}

function getDigest(digest: string | null | undefined): string | undefined {
  const hash = digest?.match(/^sha256:([a-f0-9]{64})$/i)?.[1];
  return hash?.toLowerCase();
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "oliver-apps-pick-worker",
    },
  });

  if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchSHA256(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`SHA256 download failed: ${response.status}`);

  const hash = (await response.text()).match(/[a-f0-9]{64}/i)?.[0];
  if (!hash) throw new Error("Invalid SHA256 file");

  return hash.toLowerCase();
}

function json(data: unknown, status = 200, maxAge = 900): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": maxAge > 0 ? `public, max-age=${maxAge}` : "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}
