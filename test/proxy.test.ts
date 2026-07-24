import { describe, expect, it } from "vitest";

import {
  createProxyIconURL,
  createProxyURL,
  getProxyIconTarget,
  getProxyTarget,
  isProxySourcePath,
} from "../src/index";

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

  it("rewrites configured icons through the Worker", () => {
    expect(createProxyIconURL("https://apps-pick.gcy.workers.dev", "oliver")).toBe(
      "https://apps-pick.gcy.workers.dev/proxy/icon/oliver",
    );
    expect(getProxyIconTarget("/proxy/icon/joycomic")?.toString()).toBe(
      "https://raw.githubusercontent.com/xiaoqi419/JoyComic/main/assets/app.jpg",
    );
    expect(getProxyIconTarget("/proxy/icon/fluxdo")?.toString()).toBe(
      "https://raw.githubusercontent.com/Lingyan000/fluxdo/main/ios/Runner/Assets.xcassets/AppIcon.appiconset/AppIcon-Light-1024x1024.png",
    );
    expect(getProxyIconTarget("/proxy/icon/oliver")?.toString()).toBe(
      "https://github.com/Ovler-Young.png",
    );
    expect(getProxyIconTarget("/proxy/icon/melox")?.toString()).toBe(
      "https://raw.githubusercontent.com/youshen2/MeloX/main/MeloX/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png",
    );
    expect(getProxyIconTarget("/proxy/icon/unknown")).toBeUndefined();
  });

  it("accepts the Source endpoint with or without a trailing slash", () => {
    expect(isProxySourcePath("/proxy")).toBe(true);
    expect(isProxySourcePath("/proxy/")).toBe(true);
    expect(isProxySourcePath("/proxy/owner/repo/releases/download/v1/app.ipa")).toBe(false);
  });

  it("only resolves IPA release assets and their checksum sidecars from configured repositories", () => {
    expect(
      getProxyTarget(
        "/proxy/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo-unsigned.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo-unsigned.ipa",
    );
    expect(
      getProxyTarget(
        "/proxy/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic-unsigned.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic-unsigned.ipa",
    );
    expect(
      getProxyTarget(
        "/proxy/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo-unsigned.ipa.sha256",
      )?.toString(),
    ).toBe(
      "https://github.com/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo-unsigned.ipa.sha256",
    );
    expect(
      getProxyTarget(
        "/proxy/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic-unsigned.ipa.sha256",
      )?.toString(),
    ).toBe(
      "https://github.com/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic-unsigned.ipa.sha256",
    );
    expect(
      getProxyTarget(
        "/proxy/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/czy0729/Bangumi/releases/download/upstream-8.34.3/Bangumi-8.34.3-unsigned.ipa",
    );
    expect(
      getProxyTarget(
        "/proxy/youshen2/MeloX/releases/download/v0.4.0/MeloX-iOS-unsigned.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/youshen2/MeloX/releases/download/v0.4.0/MeloX-iOS-unsigned.ipa",
    );
    expect(
      getProxyTarget(
        "/proxy/youshen2/MeloX/releases/download/v0.4.0/MeloX-iOS-unsigned.ipa.sha256",
      )?.toString(),
    ).toBe(
      "https://github.com/youshen2/MeloX/releases/download/v0.4.0/MeloX-iOS-unsigned.ipa.sha256",
    );
    expect(
      getProxyTarget("/proxy/example/other/releases/download/v1.0.0/app.ipa"),
    ).toBeUndefined();
    expect(
      getProxyTarget(
        "/proxy/xiaoqi419/unknown/releases/download/v1.0.0/joycomic-unsigned.ipa",
      ),
    ).toBeUndefined();
    expect(
      getProxyTarget(
        "/proxy/Lingyan000/unknown/releases/download/v0.2.24/fluxdo-unsigned.ipa",
      ),
    ).toBeUndefined();
    expect(
      getProxyTarget(
        "/proxy/youshen2/unknown/releases/download/v0.4.0/MeloX-iOS-unsigned.ipa",
      ),
    ).toBeUndefined();
    expect(
      getProxyTarget("/proxy/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo.apk"),
    ).toBeUndefined();
    expect(
      getProxyTarget("/proxy/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo.zip"),
    ).toBeUndefined();
    expect(
      getProxyTarget("/proxy/Lingyan000/fluxdo/releases/download/v0.2.24/fluxdo.sha256"),
    ).toBeUndefined();
    expect(
      getProxyTarget("/proxy/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic.apk"),
    ).toBeUndefined();
    expect(
      getProxyTarget("/proxy/xiaoqi419/JoyComic/releases/download/v1.0.0/joycomic.sha256"),
    ).toBeUndefined();
    expect(
      getProxyTarget(
        "/proxy/kangyun1994/zhihu-plus-plus-swift/releases/download/v0.1.0/ZhihuPlusPlus-0.1.0-unsigned-final.ipa",
      )?.toString(),
    ).toBe(
      "https://github.com/kangyun1994/zhihu-plus-plus-swift/releases/download/v0.1.0/ZhihuPlusPlus-0.1.0-unsigned-final.ipa",
    );
  });
});
