import { useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/naming-convention
type Asset = { name: string; browser_download_url: string }

type Release = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tag_name: string
  assets: Asset[]
}

enum Repo {
  LAUNCHER = 'decentraland/launcher',
  CREATOR_HUB = 'decentraland/creator-hub'
}

const findLink = (assets: Asset[], platform: string) => {
  const asset = assets.find(a => a.name.includes(platform) && (a.name.endsWith('.exe') || a.name.endsWith('.dmg')))
  return asset?.browser_download_url
}

function buildLinks(assets: Asset[]): Record<string, Record<string, string>> {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Windows: {
      amd64: findLink(assets, 'win-x64') ?? ''
    },

    macOS: {
      amd64: findLink(assets, 'mac-x64') ?? '',
      arm64: findLink(assets, 'mac-arm64') ?? ''
    }
  }
}

async function fetchLatestRelease(repo: Repo): Promise<Release | null> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    throw new Error(`Unexpected content-type: ${contentType}`)
  }

  return response.json()
}

const FALLBACK_VERSION = '0.39.1'
const CREATOR_HUB_BASE = `https://github.com/decentraland/creator-hub/releases/download/${FALLBACK_VERSION}`

const FALLBACK_LINKS: Record<Repo, Record<string, Record<string, string>>> = {
  [Repo.CREATOR_HUB]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Windows: {
      amd64: `${CREATOR_HUB_BASE}/Decentraland-Creator-Hub-${FALLBACK_VERSION}-win-x64.exe`
    },

    macOS: {
      amd64: `${CREATOR_HUB_BASE}/Decentraland-Creator-Hub-${FALLBACK_VERSION}-mac-x64.dmg`,
      arm64: `${CREATOR_HUB_BASE}/Decentraland-Creator-Hub-${FALLBACK_VERSION}-mac-arm64.dmg`
    }
  },
  [Repo.LAUNCHER]: {}
}

function useLatestGithubRelease(repo: Repo) {
  const [links, setLinks] = useState<Record<string, Record<string, string>> | null>(FALLBACK_LINKS[repo] || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

    const attemptFetch = (isRetry = false) => {
      fetchLatestRelease(repo)
        .then(data => {
          if (!cancelled && data?.assets?.length) {
            setLinks(buildLinks(data.assets))
          }
        })
        .catch(error => {
          console.error('Failed to fetch GitHub release:', error)
          if (!cancelled && !isRetry) {
            retryTimeout = setTimeout(() => attemptFetch(true), 5000)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false)
          }
        })
    }

    attemptFetch()

    return () => {
      cancelled = true
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [repo])

  return { links, loading }
}

export { Repo, useLatestGithubRelease }
