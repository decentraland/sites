const ALLOWED_DOMAINS = ['decentraland.org', 'decentraland.zone', 'decentraland.today', 'market.decentraland.org']

/**
 * Validates that a URL points to a trusted Decentraland domain.
 * Prevents open redirect/phishing from compromised notification metadata.
 */
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function safeOpenUrl(url: string): void {
  if (isAllowedUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function formatTimeAgo(timestamp: number, t: (key: string, values?: Record<string, unknown>) => string): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return t('component.landing.navbar.time_just_now')
  if (seconds < 3600) return t('component.landing.navbar.time_minutes_ago', { count: Math.floor(seconds / 60) })
  if (seconds < 86400) return t('component.landing.navbar.time_hours_ago', { count: Math.floor(seconds / 3600) })
  return t('component.landing.navbar.time_days_ago', { count: Math.floor(seconds / 86400) })
}

function formatNotificationType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export { formatNotificationType, formatTimeAgo, safeOpenUrl }
