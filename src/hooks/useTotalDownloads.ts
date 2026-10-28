import { useAsyncMemo } from '@dcl/hooks'
import { ExplorerDownloads } from '../modules/explorerDownloads'
import { formatToShorthand } from '../modules/number'

// Module-level cache so the count survives remounts across the different
// surfaces that render a DownloadModal (homepage hero, jump-in fallback).
let cachedCount: string | null = null

/**
 * Resolves the shorthand total-downloads label ("+400K") shown in the
 * DownloadModal. Shared by `useHangOutAction` (homepage) and `useLaunchExplorer`
 * (jump-in) so both modals show the same real count instead of ui2's stale
 * built-in default.
 *
 * `enabled` defers the network request until the count is actually needed — a
 * surface that only renders the modal on demand (e.g. the discover jump-in
 * fallback) passes `false` until the modal opens, so the fetch never fires for
 * the majority of visitors who never trigger it.
 */
function useTotalDownloads(enabled = true): string {
  const [rawDownloads, status] = useAsyncMemo(async () => (enabled ? ExplorerDownloads.get().getTotalDownloads() : null), [enabled])
  if (!status.loading && status.loaded && rawDownloads) cachedCount = formatToShorthand(rawDownloads)
  return cachedCount ?? '+400K'
}

export { useTotalDownloads }
