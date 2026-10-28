import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

/**
 * True when a `ProfileModalHost` is mounted by an ancestor — i.e. the subtree
 * lives inside `DappsShell`, where `?profile=<address>` is rendered as an overlay.
 *
 * Lightweight, Layout-less routes (e.g. the standalone reels viewer) render
 * OUTSIDE the shell and have no host, so this stays `false`. `useOpenProfileModal`
 * reads it to decide whether to open the overlay or navigate to the full
 * `/profile/<address>` page instead of writing a `?profile=` param nothing renders.
 *
 * Kept in its own module (no heavy imports) so lightweight consumers of
 * `useOpenProfileModal` don't pull `ProfileModal` into their bundle.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const ProfileModalHostContext = createContext(false)

function ProfileModalHostProvider({ children }: { children: ReactNode }) {
  return <ProfileModalHostContext.Provider value={true}>{children}</ProfileModalHostContext.Provider>
}

function useProfileModalHostAvailable(): boolean {
  return useContext(ProfileModalHostContext)
}

export { ProfileModalHostProvider, useProfileModalHostAvailable }
