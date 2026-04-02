import { useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/naming-convention
type Asset = { name: string; browser_download_url: string }

type Release = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tag_name: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  html_url: string
  assets: Asset[]
  prerelease: boolean
}

enum Repo {
  LAUNCHER = 'decentraland/launcher',
  CREATOR_HUB = 'decentraland/creator-hub'
}

const SEMVER_REGEX = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/

const findLink = (assets: Asset[], platform: string) => {
  const asset = assets.find(a => a.name.includes(platform))
  return asset?.browser_download_url
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const isStableRelease = ({ tag_name, prerelease }: Release) => !prerelease && SEMVER_REGEX.test(tag_name)

async function fetchLatestRelease(repo: Repo): Promise<Release | null> {
  let page = 1

  while (page <= 10) {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?page=${page}&per_page=30`)

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const releases: Release[] = await response.json()

    if (releases.length === 0) break

    const release = releases.find(isStableRelease)
    if (release) return release

    page++
  }

  return null
}

function useLatestGithubRelease(repo: Repo) {
  const [links, setLinks] = useState<Record<string, Record<string, string>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestRelease(repo)
      .then(data => {
        if (data) {
          setLinks({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Windows: {
              amd64: findLink(data.assets, 'win-x64') ?? ''
            },

            macOS: {
              amd64: findLink(data.assets, 'mac-x64') ?? '',
              arm64: findLink(data.assets, 'mac-arm64') ?? ''
            }
          })
        }
      })
      .catch(error => {
        console.error('Failed to fetch GitHub release:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [repo])

  return { links, loading }
}

export { Repo, useLatestGithubRelease }
