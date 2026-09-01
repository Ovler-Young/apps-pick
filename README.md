# Oliver's Apps Pick

Cloudflare Worker that serves an [AltStore Source](https://faq.altstore.io/distribute-your-apps/make-a-source) for selected unsigned IPA releases.

Included sources:

- [czy0729/Bangumi](https://github.com/czy0729/Bangumi)
- [Lingyan000/fluxdo](https://github.com/Lingyan000/fluxdo)
- [1wc10086/Han1mePlus](https://github.com/1wc10086/Han1mePlus)
- [celia-sh/Hana](https://github.com/celia-sh/Hana)
- [xiaoqi419/JoyComic](https://github.com/xiaoqi419/JoyComic)
- [FoxSensei001/LoveIwara](https://github.com/FoxSensei001/LoveIwara)
- [youshen2/MeloX](https://github.com/youshen2/MeloX)
- [celia-sh/Novella](https://github.com/celia-sh/Novella)
- [Predidit/oneAnime](https://github.com/Predidit/oneAnime)
- [ccbkv/PicaComic](https://github.com/ccbkv/PicaComic)
- [autobcb/qysg](https://github.com/autobcb/qysg)
- [kangyun1994/zhihu-plus-plus-swift](https://github.com/kangyun1994/zhihu-plus-plus-swift)

The Worker returns the latest five non-draft, non-prerelease IPA releases for each app. It uses the SHA-256 digest reported by GitHub Releases, or a matching `.ipa.sha256` asset when available.

Use `/proxy` or `/proxy/` as the AltStore Source URL to route the listed IPA downloads and icons through the Worker. The proxy only accepts configured release assets whose filenames end in `.ipa` or `.ipa.sha256`; it rejects other asset types and arbitrary `.sha256` files. Icon URLs must also be configured. Successful GitHub Releases API responses are cached by the Worker for 15 minutes.

## Adding a source

The helper requires an authenticated [`gh`](https://cli.github.com/) client, `unzip`, and Python 3. Supply the curated repository, icon URL, AltStore category, tint color, and an optional subtitle:

```sh
sh scripts/add-source.sh FoxSensei001/LoveIwara \
  'https://raw.githubusercontent.com/FoxSensei001/LoveIwara/master/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024%401x.png' \
  entertainment '#F89032' 'unofficial Flutter Iwara client supporting iOS and other platforms'
```

It reads the repository description and release metadata with `gh api`, lists the same eligible IPA routes used by the Worker, and inspects only the newest eligible IPA for its app metadata. It prints candidate `ICONS` and `APPS` entries for manual review; it does not edit `src/index.ts`.

## Deployment

The `main` branch workflow runs tests and type-checking. It runs `wrangler deploy` when both of these GitHub Actions secrets are configured:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Cloudflare Workers edit permission for that account

For a local deployment, authenticate Wrangler and run:

```sh
pnpm install
pnpm deploy
```
