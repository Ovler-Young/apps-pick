# Oliver's Apps Pick

Cloudflare Worker that serves an [AltStore Source](https://faq.altstore.io/distribute-your-apps/make-a-source) for selected unsigned IPA releases.

Included sources:

- [czy0729/Bangumi](https://github.com/czy0729/Bangumi)
- [Lingyan000/fluxdo](https://github.com/Lingyan000/fluxdo)
- [xiaoqi419/JoyComic](https://github.com/xiaoqi419/JoyComic)
- [youshen2/MeloX](https://github.com/youshen2/MeloX)
- [autobcb/qysg](https://github.com/autobcb/qysg)
- [kangyun1994/zhihu-plus-plus-swift](https://github.com/kangyun1994/zhihu-plus-plus-swift)

The Worker returns the latest five non-draft, non-prerelease IPA releases for each app. It uses the SHA-256 digest reported by GitHub Releases, or a matching `.ipa.sha256` asset when available.

Use `/proxy` or `/proxy/` as the AltStore Source URL to route the listed IPA downloads and icons through the Worker. The proxy only accepts configured release assets whose filenames end in `.ipa` or `.ipa.sha256`; it rejects other asset types and arbitrary `.sha256` files. Icon URLs must also be configured. Successful GitHub Releases API responses are cached by the Worker for 15 minutes.

## Deployment

The `main` branch workflow runs tests and type-checking. It runs `wrangler deploy` when both of these GitHub Actions secrets are configured:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Cloudflare Workers edit permission for that account

For a local deployment, authenticate Wrangler and run:

```sh
pnpm install
pnpm deploy
```
