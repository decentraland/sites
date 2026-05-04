// The download gateway rate-limits per-IP. If the user lands on
// /download_success, the gateway request is in flight, and they refresh, we
// don't want the second mount to fire a parallel gateway hit and trip the
// limit. Stamp sessionStorage with the start time and treat any future mount
// inside this window as already-in-flight. Cleared on completion so a
// deliberate refresh AFTER the file has been saved triggers a fresh download.
// The TTL is a safety net: if the previous tab was killed mid-flight (refresh,
// crash) the lock would otherwise pin forever.
const AUTO_DOWNLOAD_SESSION_KEY = 'downloadSuccess:triggered'
const AUTO_DOWNLOAD_LOCK_TTL_MS = 30_000

const lockKey = (autoDownloadKey: string): string => `${AUTO_DOWNLOAD_SESSION_KEY}:${autoDownloadKey}`

const isAutoDownloadLocked = (autoDownloadKey: string): boolean => {
  const raw = sessionStorage.getItem(lockKey(autoDownloadKey))
  if (!raw) return false
  const startedAt = Number.parseInt(raw, 10)
  if (!Number.isFinite(startedAt)) return false
  return Date.now() - startedAt < AUTO_DOWNLOAD_LOCK_TTL_MS
}

const acquireAutoDownloadLock = (autoDownloadKey: string): void => {
  sessionStorage.setItem(lockKey(autoDownloadKey), String(Date.now()))
}

const releaseAutoDownloadLock = (autoDownloadKey: string): void => {
  sessionStorage.removeItem(lockKey(autoDownloadKey))
}

export { AUTO_DOWNLOAD_LOCK_TTL_MS, acquireAutoDownloadLock, isAutoDownloadLocked, releaseAutoDownloadLock }
