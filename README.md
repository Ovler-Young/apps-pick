# Oliver's Apps Pick

Cloudflare Worker that serves an [AltStore Source](https://faq.altstore.io/distribute-your-apps/make-a-source) for selected unsigned IPA releases.

Included sources:

- [czy0729/Bangumi](https://github.com/czy0729/Bangumi)
- [autobcb/qysg](https://github.com/autobcb/qysg)

The Worker returns the latest five non-draft, non-prerelease IPA releases for each app. It uses the SHA-256 digest reported by GitHub Releases, or a matching `.ipa.sha256` asset when available.

## Deployment

The `main` branch workflow runs tests, type-checking, and `wrangler deploy`. Configure these GitHub Actions secrets before the first deployment:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Cloudflare Workers edit permission for that account

For a local deployment, authenticate Wrangler and run:

```sh
pnpm install
pnpm deploy
```
