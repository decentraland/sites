# jump

Launcher deep-link handler — resolves places, events, and world coordinates from the URL into the explorer launcher. Mounted under `<DappsShell />` (heavy route).

## Routes

`/jump`, `/jump/places`, `/jump/places/invalid`, `/jump/events`, `/jump/events/invalid`. Legacy `/jump/event` alias still used by production.

## Key paths

| Path                                   | Purpose                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/jump/`                      | Page components for the jump area (resolver UI, invalid-target landing pages).                                            |
| `src/components/jump/`                 | Jump-specific UI (place/event card previews, "open in explorer" CTA).                                                     |
| `src/features/places/places.client.ts` | RTK Query endpoints for `/jump/*` deep-link resolution (places, events, world coordinates). Injected into `placesClient`. |
| `src/services/placesClient.ts`         | RTK Query base for places deep-link resolution (`decentraland-places` API).                                               |

## Jump-in on touch devices

A phone gets the same two-step as desktop: `useExplorerLauncher` fires the `decentraland://open`
protocol through `src/utils/mobileAppLaunch.ts` and falls back to the tagged store URL only when it
didn't take. The app registers the scheme on both platforms (iOS `CFBundleURLSchemes`, Android
`BROWSABLE` intent-filter in the `decentraland/godotengine` fork), and `/open` is the route that
teleports; a bare `decentraland://?x` has no route.

Two mechanics worth knowing before touching this:

- **Nothing tells a web page whether a custom scheme was handled.** Both tiers infer it the same
  way: fire the navigation, listen for `visibilitychange` / `pagehide` / `blur`, and treat "page
  never lost focus" as "not installed". Desktop waits 750ms in ui2; mobile waits 1500ms because an
  app switch takes longer to report hidden.
- **Android goes through `intent://…#Intent;scheme=decentraland;package=…;S.browser_fallback_url=…`.**
  Chrome resolves it against the installed package and, when nothing handles it, opens the fallback
  URL itself, so a device without the app never hits the `ERR_UNKNOWN_URL_SCHEME` error page. iOS has
  no equivalent: an uninstalled scheme can surface Safari's "cannot open page" alert before the
  timeout redirects to the App Store.

## App links on /jump

Once the association file is served at the origin and a compatible app is installed, an external
`https://decentraland.org/jump?position=0,0&realm=raft.dcl.eth` link can open the iOS app directly.
The explorer declares `applinks:decentraland.org` in `export_presets.cfg`, and `lib/src/deep_link.rs`
accepts the host. Same-domain navigation within Safari can stay in the browser.

| File                                            | Platform | Claims                                           |
| ----------------------------------------------- | -------- | ------------------------------------------------ |
| `public/.well-known/apple-app-site-association` | iOS      | `/jump*`, `/mobile*`                             |
| `public/.well-known/assetlinks.json`            | Android  | None — empty statement list pending safe routing |

Four things to know before touching them:

- **The OS forwards the whole URL, so the app's parser is the allowlist.** An app link hands
  `deep_link.rs` the untouched query string, and it types the params it knows and ignores the rest.
  The in-page fallback above is narrower on purpose — it is not a bug that the two differ.
- **Android delegation is deliberately disabled.** The empty `assetlinks.json` keeps a valid JSON
  endpoint without authorizing the app to handle this host. The manifest currently claims `/mobile`,
  `/jump`, `/events` and `/places`; enabling verification would intercept web links such as
  `/places/place/-9,-9`, `/places/world/raft.dcl.eth` and `/events/new-event` without equivalent app
  destinations. The in-page Android `intent://` launch and store fallback do not require this association.
  [godot-explorer#2961](https://github.com/decentraland/godot-explorer/pull/2961) fixes jump subpaths,
  but still sends path-based place/world links to Discover rather than the requested destination.
  Before restoring delegation, support the claimed destinations or narrow the manifest in
  `decentraland/godotengine` (`platform/android/java/app/src/main/AndroidManifest.xml`), with a
  rollout that also accounts for older installed app versions. Merely publishing a new build does
  not update their manifests. Android 15+ supports server-side exclusions through
  [Dynamic App Links](https://developer.android.com/training/app-links/configure-assetlinks), but
  older Android versions ignore those rules, so they cannot make a broad association safe on their own.
- **The app's router matches exact paths, and the website uses subpaths.**
  `deep_link_router.gd` matches `/jump`, `/open`, `/events` and `/places` literally; anything else
  falls to a default that teleports, which silently does nothing when the URL carries no position
  or realm. So `/jump?position=&realm=` works, `/jump/places?position=` works by accident (it
  teleports through the default), and `/jump/events?id=<uuid>` — the shape the app's own
  notifications and share links use — opens the app and does nothing. That needs a godot-explorer
  fix before activating the iOS `/jump*` claim, including a rollout plan for older installed builds.
- **`decentraland.zone` gets both files from the same bundle.** Android delegation remains disabled
  there too. The app declares `applinks:decentraland.zone`, and `deep_link.rs` infers `dclenv=zone`
  from the host for iOS app links.

### Shipping them takes two repos

Putting the files in `public/` is necessary and not sufficient. Production does not serve `public/`
at the site origin: the built HTML points every asset at `cdn.decentraland.org/@dcl/sites/<version>/`
(favicon included), and the `sites-deployer` worker proxies only a short allowlist of paths through
to that bundle — `robots.txt` and `whitepaper*.pdf` today. Everything else returns the SPA shell:

```bash
curl -sI https://decentraland.org/robots.txt       # text/plain, via CloudFront  → allowlisted
curl -sI https://decentraland.org/favicon.ico      # text/html                   → SPA shell
```

So this repo puts the files in the bundle, and a companion MR on `sites-deployer`
(`dcl.tools:ops/sites-deployer`, GitLab) adds the two paths to that allowlist. Same two-repo shape as
the SEO `PAGES` map — see skill `seo-worker`. Until the worker side lands, the files are reachable
only on the CDN:

```bash
curl -sI https://cdn.decentraland.org/@dcl/sites/<version>/.well-known/assetlinks.json
```

The worker MR also needs to set `Content-Type: application/json` on both. `assetlinks.json` carries
its own extension and the CDN types it correctly, but Apple's spec makes the AASA file
extension-less, so verify it rather than assuming it. The `vercel.json` entries added alongside these
files cover previews only (CLAUDE.md → Deployment).

Verify after both sides deploy:

```bash
curl -sI https://decentraland.org/.well-known/apple-app-site-association   # want application/json
curl -sI https://decentraland.org/.well-known/assetlinks.json              # want application/json
curl -s https://decentraland.org/.well-known/assetlinks.json               # want []
```

`scripts/check-app-links.spec.ts` guards the iOS association and requires Android's statement list to
stay empty. If a nonempty Android association was already served, cached verification on devices may
persist; publishing `[]` is not an immediate revocation. Coordinate the worker rollout and verify on
fresh installs as well as previously verified devices before relying on browser routing.

## Auth

Jump can run without identity. Reads are anonymous.

## Cross-references

- Skill `rtk-query-split` — RTK Query architecture + rules 17 & 18.
- Skill `add-route` — adding new routes under `/jump/*`.
