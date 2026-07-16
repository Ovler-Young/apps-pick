# Oliver's Apps Pick

Cloudflare Worker that serves an [AltStore Source](https://faq.altstore.io/distribute-your-apps/make-a-source) for selected unsigned IPA releases.

Included sources:

- [czy0729/Bangumi](https://github.com/czy0729/Bangumi)
- [autobcb/qysg](https://github.com/autobcb/qysg)

The Worker returns the latest five non-draft, non-prerelease IPA releases for each app. It uses the SHA-256 digest reported by GitHub Releases, or a matching `.ipa.sha256` asset when available.

Use `/proxy` or `/proxy/` as the AltStore Source URL to route the listed IPA downloads through the Worker. The proxy only accepts release assets from the repositories listed above. Successful GitHub Releases API responses are cached by the Worker for 15 minutes.

## Deployment

The `main` branch workflow runs tests and type-checking. It runs `wrangler deploy` when both of these GitHub Actions secrets are configured:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Cloudflare Workers edit permission for that account

For a local deployment, authenticate Wrangler and run:

```sh
pnpm install
pnpm deploy
```
