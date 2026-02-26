import { useEffect, useState } from 'react'

type Asset = { name: string; browserDownloadUrl: string }

type Release = {
  tagName: string
  htmlUrl: string
  assets: Array<Asset>
  prerelease: boolean
}

enum Repo {
  LAUNCHER = 'decentraland/launcher',
  CREATOR_HUB = 'decentraland/creator-hub'
}

// Regex to match valid semver tag names (e.g., "v1.2.3", "1.2.3", "v2.0.0-beta.1")
const SEMVER_REGEX = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/

const findLink = (assets: Asset[], platform: string) => {
  const asset = assets.find(a => a.name.includes(platform))
  if (asset) {
    return asset.browserDownloadUrl
  }
  throw new Error(`No asset found for ${platform}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRelease = (raw: any): Release => ({
  tagName: raw.tag_name,
  htmlUrl: raw.html_url,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assets: raw.assets.map((a: any) => ({
    name: a.name,
    browserDownloadUrl: a.browser_download_url
  })),
  prerelease: raw.prerelease
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLatestServerRelease = (release: any) => !release.prerelease && SEMVER_REGEX.test(release.tag_name)

async function fetchLatestServerRelease(repo: Repo): Promise<Release | null> {
  let page = 1
  let hasMoreReleases = true

  while (hasMoreReleases) {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?page=${page}&per_page=30`)

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const releases = await response.json()

    if (releases.length === 0) {
      hasMoreReleases = false
      break
    }

    const serverRelease = releases.find(isLatestServerRelease)
    if (serverRelease) {
      return mapRelease(serverRelease)
    }

    page++
  }

  console.warn(`No server release found in repo: ${repo}`)
  return null
}

function useLatestGithubRelease(repo: Repo) {
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [links, setLinks] = useState<Record<string, Record<string, string>> | null>(null)

  useEffect(() => {
    fetchLatestServerRelease(repo)
      .then(data => {
        if (data) {
          setRelease(data)
          setLinks({
            ['Windows']: {
              amd64: findLink(data.assets, 'win-x64')
            },
            ['macOS']: {
              amd64: findLink(data.assets, 'mac-x64'),
              arm64: findLink(data.assets, 'mac-arm64')
            }
          })
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [repo])

  return { release, loading, error, links }
}

export { type Asset, type Release, Repo, useLatestGithubRelease }
