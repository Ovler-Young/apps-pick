export interface GitHubAsset {
  browser_download_url: string;
  digest?: string | null;
  name: string;
  size: number;
}

export interface GitHubRelease {
  assets: GitHubAsset[];
  draft: boolean;
  name: string | null;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
}

export interface IpaRelease {
  ipa: GitHubAsset;
  release: GitHubRelease;
  shaFile?: GitHubAsset;
  version: string;
}

export function findIpaReleases(
  releases: GitHubRelease[],
  maxVersions = 5,
): IpaRelease[] {
  const ipaReleases: IpaRelease[] = [];

  for (const release of releases) {
    if (release.draft || release.prerelease) continue;

    const ipa = release.assets.find((asset) => /\.ipa$/i.test(asset.name));
    const version = findVersion(release);

    if (!ipa || !version) continue;

    ipaReleases.push({
      ipa,
      release,
      shaFile: release.assets.find((asset) => /\.ipa\.sha256$/i.test(asset.name)),
      version,
    });

    if (ipaReleases.length === maxVersions) break;
  }

  return ipaReleases;
}

function findVersion(release: GitHubRelease): string | undefined {
  const versionPattern = /\d+(?:\.\d+){1,3}/;

  return release.name?.match(versionPattern)?.[0] ?? release.tag_name.match(versionPattern)?.[0];
}
