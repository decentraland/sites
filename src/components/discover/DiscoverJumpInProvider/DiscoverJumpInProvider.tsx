/* eslint-disable @typescript-eslint/naming-convention -- React context is PascalCase by convention */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DownloadModal } from 'decentraland-ui2'
import { discoverDeepLinkOptions, discoverPlacePayload } from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { buildDeepLinkOptions } from '../../../features/places/places.helpers'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { useDownloadModalProps } from '../../../hooks/useDownloadModalProps'
import { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher } from '../../../hooks/useExplorerLauncher'
import { SegmentEvent } from '../../../modules/segment'

interface DiscoverJumpInContextValue {
  // Launch a place in the desktop client, or — when the client isn't installed
  // — open the download modal. `surface` is the Segment `place` dimension of the
  // DISCOVER_JUMP_IN event (e.g. 'place-card', 'scene-preview').
  jumpIn: (place: DiscoverPlace, surface: string) => void
}

// Null default: a consumer rendered outside the provider falls back to a
// warning no-op (see `noProviderFallback` below) instead of throwing.
const DiscoverJumpInContext = createContext<DiscoverJumpInContextValue | null>(null)

// Single owner of the "JUMP IN → install first" flow for the whole /discover
// section. Mounts ONE DownloadModal (instead of one per card) and hands every
// card/detail surface a `jumpIn(place, surface)` that deep-links into the
// installed client and falls back to the modal when the launch doesn't take.
function DiscoverJumpInProvider({ children }: { children: ReactNode }) {
  const track = useDeferredTrack()
  const { launch, isMobile, osName, arch } = useExplorerLauncher()
  const [isModalOpen, setModalOpen] = useState(false)
  // Deep-link of the place the user tried to launch — carried into the download
  // URL so the client opens at that scene on first run after installing.
  const [pendingDeepLink, setPendingDeepLink] = useState<{ position?: string; realm?: string }>({})

  const jumpIn = useCallback(
    async (place: DiscoverPlace, surface: string) => {
      track(SegmentEvent.DISCOVER_JUMP_IN, { ...discoverPlacePayload(place), place: surface })

      const options = discoverDeepLinkOptions(place)
      const outcome = await launch(options)
      // Couldn't launch → prompt the download (mobile already went to the store,
      // a successful launch needs nothing more).
      if (shouldPromptDownload(outcome)) {
        if (isClientNotInstalled(outcome)) track(SegmentEvent.CLICK, { event: SegmentEvent.CLIENT_NOT_INSTALLED, os: osName, arch })
        setPendingDeepLink(options)
        setModalOpen(true)
      }
    },
    [track, launch, osName, arch]
  )

  const value = useMemo<DiscoverJumpInContextValue>(() => ({ jumpIn }), [jumpIn])

  // Same download-URL + tracking-param threading as the homepage jump-in, keyed
  // to the place the user last tried to launch. Gated on `isModalOpen` so the
  // total-downloads fetch never fires for the many visitors who never hit the
  // "install first" fallback.
  const downloadModalProps = useDownloadModalProps(buildDeepLinkOptions(pendingDeepLink), isModalOpen)

  return (
    <DiscoverJumpInContext.Provider value={value}>
      {children}
      {!isMobile && <DownloadModal open={isModalOpen} onClose={() => setModalOpen(false)} {...downloadModalProps} />}
    </DiscoverJumpInContext.Provider>
  )
}

// Consumers get the shared launcher. Outside a provider (only reachable in
// isolated unit tests, or a discover card mistakenly mounted outside
// DiscoverLayout) `jumpIn` is a no-op so a click doesn't throw — with a dev
// warning so a missing-provider regression is visible instead of silent.
const noProviderFallback: DiscoverJumpInContextValue = {
  jumpIn: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[discover] useDiscoverJumpIn used outside DiscoverJumpInProvider — JUMP IN is a no-op')
    }
  }
}

function useDiscoverJumpIn(): DiscoverJumpInContextValue {
  return useContext(DiscoverJumpInContext) ?? noProviderFallback
}

export { DiscoverJumpInProvider, useDiscoverJumpIn }
