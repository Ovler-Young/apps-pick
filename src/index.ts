import { findIpaReleases, type GitHubRelease } from "./catalog";

interface AppConfig {
  bundleIdentifier: string;
  category: string;
  developerName: string;
  iconKey: string;
  iconURL: string;
  localizedDescription: string;
  minOSVersion: string;
  name: string;
  repo: string;
  subtitle: string;
  tintColor: string;
}

interface IconConfig {
  key: string;
  url: string;
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
const FLUXDO_ICON =
  "https://raw.githubusercontent.com/Lingyan000/fluxdo/main/ios/Runner/Assets.xcassets/AppIcon.appiconset/AppIcon-Light-1024x1024.png";
const JOYCOMIC_ICON = "https://raw.githubusercontent.com/xiaoqi419/JoyComic/main/assets/app.jpg";
const OLIVER_ICON = "https://github.com/Ovler-Young.png";
const QYSG_ICON = "https://github.com/autobcb.png";
const ZHIHU_ICON = "https://github.com/kangyun1994.png";

const ICONS: IconConfig[] = [
  { key: "bangumi", url: BANGUMI_ICON },
  { key: "fluxdo", url: FLUXDO_ICON },
  { key: "joycomic", url: JOYCOMIC_ICON },
  { key: "oliver", url: OLIVER_ICON },
  { key: "qysg", url: QYSG_ICON },
  { key: "zhihu-plus-plus-swift", url: ZHIHU_ICON },
];

const APPS: AppConfig[] = [
  {
    name: "Bangumi",
    bundleIdentifier: "tv.bangumi.czy0729",
    developerName: "czy0729",
    iconKey: "bangumi",
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
    name: "FluxDO",
    bundleIdentifier: "com.github.lingyan000.fluxdo",
    developerName: "Lingyan000",
    iconKey: "fluxdo",
    subtitle: "一个 Linux.do 第三方客户端",
    localizedDescription: "一个 Linux.do 第三方客户端",
    iconURL: FLUXDO_ICON,
    tintColor: "#FFB30C",
    category: "social",
    repo: "Lingyan000/fluxdo",
    minOSVersion: "14.0",
  },
  {
    name: "JoyComic",
    bundleIdentifier: "com.example.joycomic",
    developerName: "xiaoqi419",
    iconKey: "joycomic",
    subtitle: "聚合哔咔与禁漫双源的 iOS 漫画阅读器",
    localizedDescription: "",
    iconURL: JOYCOMIC_ICON,
    tintColor: "#F33686",
    category: "books",
    repo: "xiaoqi419/JoyComic",
    minOSVersion: "13.0",
  },
  {
    name: "轻悦时光",
    bundleIdentifier: "com.autobcb.qysg",
    developerName: "autobcb",
    iconKey: "qysg",
    subtitle: "多平台阅读软件",
    localizedDescription: "轻悦时光发布仓库",
    iconURL: QYSG_ICON,
    tintColor: "#4C9A8B",
    category: "books",
    repo: "autobcb/qysg",
    minOSVersion: "15.0",
  },
  {
    name: "Zhihu++ Swift",
    bundleIdentifier: "com.kangyun1994.zhihu-plus-plus-swift",
    developerName: "kangyun1994",
    iconKey: "zhihu-plus-plus-swift",
    subtitle: "原生 Swift/SwiftUI 知乎客户端",
    localizedDescription:
      "Zhihu++ 原生 Swift/SwiftUI iOS 客户端，基于 zly2006/zhihu-plus-plus，AGPL-3.0-only。",
    iconURL: ZHIHU_ICON,
    tintColor: "#3D79B6",
    category: "social",
    repo: "kangyun1994/zhihu-plus-plus-swift",
    minOSVersion: "16.0",
  },
];

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") return source();
    if (isProxySourcePath(url.pathname)) return source(url.origin);
    if (url.pathname.startsWith("/proxy/icon/")) return proxyIcon(request, url.pathname);
    if (url.pathname.startsWith("/proxy/")) return proxyDownload(request, url.pathname);

    return json({ error: "Not found" }, 404, 0);
  },
};

async function source(proxyOrigin?: string): Promise<Response> {
  try {
    const apps = await Promise.all(APPS.map((app) => toApp(app, proxyOrigin)));
    const sourceIconURL = proxyOrigin
      ? createProxyIconURL(proxyOrigin, "oliver")
      : OLIVER_ICON;

    return json(
      {
        name: "Oliver's Apps Pick",
        subtitle: "Curated unsigned IPA releases",
        description: "Oliver的Apps Pick",
        iconURL: sourceIconURL,
        headerURL: sourceIconURL,
        website: "https://github.com/Ovler-Young/apps-pick",
        tintColor: "#F09199",
        featuredApps: APPS.map((app) => app.bundleIdentifier),
        apps,
        news: [],
      },
      200,
      0,
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
    iconURL: proxyOrigin
      ? createProxyIconURL(proxyOrigin, app.iconKey)
      : app.iconURL,
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

export function createProxyIconURL(origin: string, iconKey: string): string {
  return `${origin}/proxy/icon/${iconKey}`;
}

export function isProxySourcePath(pathname: string): boolean {
  return pathname === "/proxy" || pathname === "/proxy/";
}

function proxyDownload(request: Request, pathname: string): Promise<Response> {
  const target = getProxyTarget(pathname);
  if (!target) return Promise.resolve(json({ error: "Not found" }, 404, 0));

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Promise.resolve(json({ error: "Method not allowed" }, 405, 0));
  }

  return fetchUpstream(request, target);
}

function proxyIcon(request: Request, pathname: string): Promise<Response> {
  const target = getProxyIconTarget(pathname);
  if (!target) return Promise.resolve(json({ error: "Not found" }, 404, 0));

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Promise.resolve(json({ error: "Method not allowed" }, 405, 0));
  }

  return fetchUpstream(request, target);
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
    !APPS.some((app) => app.repo === repo) ||
    !/\.ipa(?:\.sha256)?$/i.test(asset)
  ) {
    return undefined;
  }

  return new URL(`https://github.com/${owner}/${repository}/releases/download/${tag}/${asset}`);
}

export function getProxyIconTarget(pathname: string): URL | undefined {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 3 || segments[0] !== "proxy" || segments[1] !== "icon") {
    return undefined;
  }

  const icon = ICONS.find((candidate) => candidate.key === segments[2]);
  return icon ? new URL(icon.url) : undefined;
}

async function fetchUpstream(request: Request, target: URL): Promise<Response> {
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
  const cache = caches.default;
  const cacheKey = new Request(url);
  const cached = await cache.match(cacheKey);

  if (cached) return cached.json() as Promise<T>;

  const response = await fetch(cacheKey, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "oliver-apps-pick-worker",
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 900,
    },
  });

  if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);

  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=900");
  const cacheable = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  await cache.put(cacheKey, cacheable.clone());
  return cacheable.json() as Promise<T>;
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
