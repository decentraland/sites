---
name: auth-flow
description: Use when working with authentication, identity, wallet, or sign-in/sign-out logic in the SPA. Covers the localStorage-based wallet hooks, identity resolution, signed mutations, and the no-Web3-providers boundary. Triggers on edits to `src/hooks/useWalletAddress.ts`, `src/hooks/useAuthIdentity.ts`, `src/utils/signedFetch.ts`, or any code touching `single-sign-on-*`, MetaMask `accountsChanged`, or sign-in/sign-out flows. Also on mentions of "auth", "identity", "wallet", "sign-in", "sign-out", "signedFetch", "SSO".
---

# auth-flow

This SPA has **no Web3 providers** (no wagmi, magic-sdk, core-web3, thirdweb). Authentication is entirely localStorage-based, which is what lets lightweight routes ship without ~580-780KB of crypto deps.

## Wallet & identity hooks

- **`useWalletAddress()`** (`src/hooks/useWalletAddress.ts`) — reads `single-sign-on-*` keys from `localStorage`. Subscribes to MetaMask `accountsChanged` and cross-tab `storage` events. Sync store pattern (`useSyncExternalStore`), safe on lightweight routes (no Redux needed).
- **`useAuthIdentity()`** (`src/hooks/useAuthIdentity.ts`) — wraps `useWalletAddress`, returns `{ identity, hasValidIdentity, address }`. Identity comes from `localStorageGetIdentity()` (`@dcl/single-sign-on-client`).

## Sign-in / Sign-out

- **Sign-in**: navbar button → redirects to the external `/auth` SSO dapp. On return, identity is in `localStorage` and the hooks pick it up automatically via the `storage` event.
- **Sign-out**: navbar button → `useWalletAddress.disconnect()` clears these `localStorage` keys:
  - `single-sign-on-*`
  - `wagmi*`
  - `wc@2*`
  - `dcl_magic_user_email`
  - `dcl_thirdweb_user_email`

## Signed mutations

Routes that mutate data (whats-on create event, social communities, storage uploads, etc.) call `signedFetch(url, identity)` from `src/utils/signedFetch.ts`. The helper signs the request payload with the identity's ephemeral key — backend validates and authorizes.

**Blog public endpoints** don't need identity.

## Boundary rule (lightweight tier)

`useAuthIdentity` and `useWalletAddress` are **safe on lightweight routes**. They don't import Redux or Web3 providers. The navbar (`src/components/LandingNavbar/`) consumes `useWalletAddress` directly and is part of the lightweight `<Layout />`.

Do NOT introduce wagmi, magic-sdk, core-web3, or thirdweb into this repo. The whole reason for the dual-shell architecture is that lightweight routes stay lean — see CLAUDE.md > Architecture > Dual Shell.

## Pitfalls

- Forgetting that `useWalletAddress` is reactive — components re-render when the user signs in/out from another tab. If you cache identity in `useState`, you'll show stale data.
- Reaching for wagmi or magic-sdk because they're familiar — those would re-add the ~580KB of deps we deleted.
- Calling `signedFetch` on a route that runs before `useAuthIdentity` settles → `identity` is `undefined` and the request 401s. Gate on `hasValidIdentity`.
- OTP/Magic email sign-in maps to a stable on-chain wallet address. Sign-in pending snapshot logic must fingerprint the ephemeral payload, not just addresses.
- `/blog/sign-in` uses a parallel redirect helper (`blogAuthRedirect`) that does NOT call `markSignInPending` — any wallet-switcher flow there will land on a stale wallet.
