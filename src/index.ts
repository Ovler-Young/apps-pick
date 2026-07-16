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
    localizedDescription:
      ":electron: An unofficial https://bgm.tv ui first app client for Android and iOS, built with React Native. 一个无广告、以爱好为驱动、不以盈利为目的、专门做 ACG 的类似豆瓣的追番记录，bgm.tv 第三方客户端。为移动端重新设计，内置大量加强的网页端难以实现的功能，且提供了相当的自定义选项。 目前已适配 iOS / Android。",
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
    localizedDescription: "轻悦时光发布仓库",
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

    if (url.pathname.startsWith("/proxy/")) {
      return proxyDownload(request, url.pathname);
    }

    if (url.pathname === "/") return source();
    if (url.pathname === "/proxy") return source(url.origin);

    return json({ error: "Not found" }, 404, 0);
  },
};

async function source(proxyOrigin?: string): Promise<Response> {
  try {
    const apps = await Promise.all(APPS.map((app) => toApp(app, proxyOrigin)));

    return json(
      {
        name: "Oliver's Apps Pick",
        subtitle: "Curated unsigned IPA releases",
        description: "Oliver的Apps Pick",
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
}

async function toApp(app: AppConfig, proxyOrigin?: string) {
  return {
    name: app.name,
    bundleIdentifier: app.bundleIdentifier,
    developerName: app.developerName,
    subtitle: app.subtitle,
    localizedDescription: app.localizedDescription,
    iconURL: app.iconURL,
    tintColor: app.tintColor,
    category: app.category,
    versions: await getVersions(app, proxyOrigin),
  };
}

async function getVersions(app: AppConfig, proxyOrigin?: string): Promise<AppVersion[]> {
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
      downloadURL: proxyOrigin
        ? createProxyURL(proxyOrigin, ipa.browser_download_url)
        : ipa.browser_download_url,
      size: ipa.size,
      sha256: getDigest(ipa.digest) ?? (shaFile ? await fetchSHA256(shaFile.browser_download_url) : undefined),
      minOSVersion: app.minOSVersion,
    })),
  );
}

export function createProxyURL(origin: string, githubDownloadURL: string): string {
  const downloadURL = new URL(githubDownloadURL);
  return `${origin}/proxy${downloadURL.pathname}`;
}

function proxyDownload(request: Request, pathname: string): Promise<Response> {
  const target = getProxyTarget(pathname);
  if (!target) return Promise.resolve(json({ error: "Not found" }, 404, 0));

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Promise.resolve(json({ error: "Method not allowed" }, 405, 0));
  }

  return fetchUpstreamDownload(request, target);
}

export function getProxyTarget(pathname: string): URL | undefined {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 7) return undefined;

  const [proxy, owner, repository, releases, download, tag, asset] = segments;
  const repo = `${owner}/${repository}`;

  if (
    proxy !== "proxy" ||
    releases !== "releases" ||
    download !== "download" ||
    !APPS.some((app) => app.repo === repo)
  ) {
    return undefined;
  }

  return new URL(`https://github.com/${owner}/${repository}/releases/download/${tag}/${asset}`);
}

async function fetchUpstreamDownload(request: Request, target: URL): Promise<Response> {
  const headers = new Headers({ "User-Agent": "oliver-apps-pick-worker" });
  const range = request.headers.get("range");

  if (range) headers.set("range", range);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    redirect: "follow",
  });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("access-control-allow-origin", "*");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
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
