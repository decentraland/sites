# AI Agent Context

**Service Purpose:**

`landing-site` (`@dcl/landing-site-site`) is a Vite/React SPA that serves as the new Decentraland main landing page. It replaces the Gatsby-based `landing` app with a faster, more maintainable architecture. All marketing content (hero, missions, FAQ, banners, social proof, marquee, trending news) is fetched at runtime from Contentful CMS via RTK Query, using per-section Contentful entry IDs stored in configuration.

**Key Capabilities:**

- Hero section with animated content and primary CTA (download or play in browser)
- Missions section (experience / create / influence cards)
- BannerCTA sections (e.g., "Create Your Avatar", "Start Exploring")
- TrendingNews / "What's Hot" section (trending scenes and events)
- SocialProof section
- FAQ accordion
- TextMarquee scrolling banner
- DownloadOptions with OS/architecture detection (Windows/macOS, arm64/amd64)
- Lazy-loaded below-the-fold sections (React `Suspense` + `lazy`)
- Wallet-based authentication via Magic SDK and WalletConnect (wagmi/viem)
- Sign-in redirect page (`src/pages/SignInRedirect.tsx`)
- Segment analytics tracking
- Feature flags (`src/modules/ff.ts`)
- i18n via `react-intl`
- `newUser` query param support: hides navbar for onboarding flow

**Communication Pattern:**

- Pure client-side SPA (Vite, no SSR or SSG)
- All content fetched at runtime via RTK Query using a custom `cmsBaseQuery` (`src/services/api.ts`) that calls Contentful's REST API directly
- In development, Vite proxies `/api/cms` to avoid CORS; in production the app calls `cms.decentraland.org` directly
- Each landing section has its own RTK Query endpoint in `src/features/landing/landing.client.ts`, keyed by a Contentful entry ID from config
- Hero is fetched first (priority); all other sections fetch in parallel and render independently

**Technology Stack:**

- Runtime: Node.js 20.x
- Language: TypeScript 5.9
- Frontend Framework: React 18 with React Router DOM 7
- Build Tool: Vite 5 with `vite-plugin-node-polyfills`
- State Management: Redux Toolkit 2 (RTK Query for data fetching)
- Styling: decentraland-ui2 0.44 (MUI-based), `@mui/icons-material`
- CMS: Contentful (direct REST API via custom RTK Query base)
- Auth: Magic SDK + wagmi/viem + WalletConnect
- Carousel: Swiper 12
- Marquee: `react-fast-marquee`
- Intersection Observer: `react-intersection-observer`
- Analytics: Segment (via `src/modules/segment.ts`)
- Testing: Jest 29 + ts-jest
- Linting: ESLint 9 + Prettier, Husky pre-commit hooks

**External Dependencies:**

- Contentful CMS REST API (`cms.decentraland.org/spaces/ea2ybdmmn1kv/environments/master`) — all landing page content sections, fetched by per-section entry ID
- Decentraland Catalyst peer (`peer.decentraland.org`) — auth profile context
- Decentraland Auth (`decentraland.org/auth`) — SSO authentication
- Magic SDK — email/social login
- WalletConnect / wagmi — wallet login
- Segment — analytics

**Key Concepts:**

- **Per-section Contentful entry IDs**: Each landing section is a distinct Contentful entry whose ID is stored in `src/config/env/prd.json` (e.g., `CONTENTFUL_HOMEPAGE_HERO_ID`, `CONTENTFUL_LANDING_MISSIONS_V2_ID`, `CONTENTFUL_LANDING_FAQ_ID`). RTK Query endpoints in `landing.client.ts` read the relevant ID from config and call `/entries/{id}`.
- **`resolveLinks` helper** (`src/features/landing/landing.helper.ts`): Contentful entries returned from the REST API contain `{sys: {type: "Link"}}` references. `resolveLinks` recursively resolves these into fully hydrated objects before passing them to mappers.
- **Section mappers** (`src/features/landing/landing.mappers.ts`): Each section has a dedicated mapper (`mapHero`, `mapMissions`, `mapFaq`, `mapBannerCta`, `mapSocialProof`, `mapTextMarquee`, `mapWhatsHot`) that transforms raw Contentful responses into typed domain objects (`landing.types.ts`).
- **Contentful type definitions** (`src/features/landing/contentful.types.ts`): TypeScript interfaces for raw Contentful entry shapes (hero, missions, FAQ, banners, social proof, marquee, what's hot) used by mappers before transformation.
- **Lazy loading**: Below-the-fold components (`Missions`, `BannerCTA`, `TrendingNews`, `SocialProof`, `TextMarquee`, `Faqs`) are dynamically imported via `React.lazy` + `Suspense` in `src/pages/index.tsx` to reduce initial bundle size.
- **`newUser` param**: When the URL contains `?newUser`, `?newuser`, `?new_user`, or `?new-user`, the navbar is hidden to create a clean onboarding experience.
- **`DownloadOptions`** (`src/components/Landing/DownloadOptions`): Uses `@dcl/hooks`'s `useAdvancedUserAgentData` to detect OS and CPU architecture, then resolves the appropriate Explorer download URL from `src/modules/explorerDownloads.ts`.
- **RTK Query cache tags**: All landing endpoints share the `LandingContent` tag, allowing a single invalidation to refresh all sections.

**Out of Scope:**

- No blog, marketplace, DAO, or community features
- No event creation, place management, or world browsing
- No server-side rendering (Gatsby/Next.js is not used)
- No image uploads or CMS content authoring
- Jump-in deep-link launch is not handled here (that is `jump-site`)

**Project Structure:**

```
src/
  app/              Redux store setup
  components/
    Buttons/        Shared button variants
    Icon/           SVG icon components
    Landing/
      BannerCTA/           CTA banner section
      DownloadOptions/     OS-aware download button group
      Faqs/                FAQ accordion section
      Hero/                Hero section (priority-loaded)
      Missions/            Missions cards section
      SocialProof/         Social proof section
      TextMarquee/         Scrolling marquee section
      TrendingNews/        Trending scenes/events feed
    Layout/         Page shell (navbar, footer wrapper)
    Video/          Video player wrapper
    WrapDecentralandText/  Text with Decentraland branding
  config/
    env/            dev.json, stg.json, prd.json (per-env variables + Contentful entry IDs)
    env.ts          getEnv() accessor
    index.ts        config instance (via @dcl/ui-env)
  features/
    landing/
      landing.client.ts    RTK Query endpoints (one per content section)
      landing.helper.ts    resolveLinks() for Contentful reference resolution
      landing.mappers.ts   Per-section content mappers
      landing.types.ts     Typed domain interfaces for mapped content
      contentful.types.ts  Raw Contentful entry type definitions
    profile/        Profile fetching (Catalyst peer)
    web3/           wagmi/viem chain config
  hooks/            useFormatMessage adapter, useAdvancedUserAgentData wrappers
  images/           Static image assets
  intl/             i18n message definitions
  modules/
    downloadWithIdentity.ts  Authenticated download flow
    explorerDownloads.ts     Download URL resolution by OS/arch
    explorerDownloads.types.ts
    ff.ts                    Feature flag helpers
    segment.ts               SegmentEvent enum and tracking utilities
    userAgent.ts             OS/architecture detection helpers
    webgpu.ts                WebGPU capability detection
  pages/
    index.tsx        Main landing page (assembles all sections)
    index.styled.ts  Page-level styled components
    index.types.ts   Feed enum and page-level types
    SignInRedirect.tsx  Auth callback redirect handler
  services/
    api.ts           RTK Query base API instance (cmsBaseQuery pointing to Contentful)
  App.tsx            Root component with providers and router
  main.tsx           App entry point
```

**Configuration:**

Key environment variables (defined in `src/config/env/prd.json`):

| Variable                                | Purpose                                          |
| --------------------------------------- | ------------------------------------------------ |
| `CONTENTFUL_SPACE_ID`                   | Contentful space ID                              |
| `CONTENTFUL_ENVIRONMENT`                | Contentful environment (e.g., `master`)          |
| `CONTENTFUL_HOMEPAGE_HERO_ID`           | Contentful entry ID for hero section             |
| `CONTENTFUL_LANDING_MISSIONS_V2_ID`     | Contentful entry ID for missions section         |
| `CONTENTFUL_LANDING_FAQ_ID`             | Contentful entry ID for FAQ section              |
| `CONTENTFUL_LANDING_CREATE_AVATAR_ID`   | Contentful entry ID for "Create Avatar" banner   |
| `CONTENTFUL_LANDING_START_EXPLORING_ID` | Contentful entry ID for "Start Exploring" banner |
| `CONTENTFUL_LANDING_WHATS_HOT_ID`       | Contentful entry ID for "What's Hot" section     |
| `CONTENTFUL_LANDING_MARQUEE_ID`         | Contentful entry ID for text marquee             |
| `CONTENTFUL_LANDING_SOCIAL_PROOF_ID`    | Contentful entry ID for social proof section     |
| `CONTENTFUL_LANDING_INVITE_HERO_ID`     | Contentful entry ID for invite hero              |
| `AUTH_URL`                              | Decentraland SSO auth URL                        |
| `PEER_URL`                              | Decentraland Catalyst peer URL                   |
| `ONBOARDING_URL`                        | New-user onboarding URL                          |
| `MAGIC_API_KEY`                         | Magic SDK publishable key                        |
| `WALLET_CONNECT_PROJECT_ID`             | WalletConnect project ID                         |

**Testing:**

- Framework: Jest 29 with ts-jest
- Entry point: `src/dummy.test.ts` (placeholder)
- Run: `npm test` / `npm run test:coverage`
- Tests are expected to be co-located with feature files; no E2E test setup is present
