import { useEffect, useMemo, useState } from 'react'
import type { Avatar } from '@dcl/schemas'
import { buildMinimalAvatar } from '../utils/avatar'
import { getProfileFaceUrl } from '../utils/profileFace'

type CreatorAvatarResult = {
  avatar: Avatar | undefined
  avatarFace: string | undefined
}

type FaceStatus = 'pending' | 'ready' | 'broken'

// Event/place creator addresses come from external sources (places/events API)
// and frequently lack a deployed profile image. We build the face URL directly
// (no lambdas call) and only expose it after a fetch probe confirms it exists.
// Expiry means a transient CDN blip does not permanently blacklist the URL.
const BROKEN_TTL_MS = 5 * 60 * 1000
const brokenFaceExpiries = new Map<string, number>()

function isFaceBroken(url: string): boolean {
  const expiresAt = brokenFaceExpiries.get(url)
  if (expiresAt === undefined) return false
  if (expiresAt <= Date.now()) {
    brokenFaceExpiries.delete(url)
    return false
  }
  return true
}

function markFaceBroken(url: string): void {
  brokenFaceExpiries.set(url, Date.now() + BROKEN_TTL_MS)
}

function getInitialFaceStatus(rawFace: string | undefined): FaceStatus {
  if (!rawFace || isFaceBroken(rawFace)) return 'broken'
  return 'pending'
}

function useCreatorAvatar(address: string | undefined, name?: string): CreatorAvatarResult {
  const rawFace = address ? getProfileFaceUrl(address) : undefined
  const [faceStatus, setFaceStatus] = useState<FaceStatus>(() => getInitialFaceStatus(rawFace))

  useEffect(() => {
    if (!rawFace) {
      setFaceStatus('broken')
      return
    }
    if (isFaceBroken(rawFace)) {
      setFaceStatus('broken')
      return
    }

    setFaceStatus('pending')
    const controller = new AbortController()
    let cancelled = false

    fetch(rawFace, { method: 'HEAD', cache: 'force-cache', signal: controller.signal })
      .then(res => {
        if (cancelled) return
        if (res.ok) {
          setFaceStatus('ready')
          return
        }
        markFaceBroken(rawFace)
        setFaceStatus('broken')
      })
      .catch(err => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        markFaceBroken(rawFace)
        setFaceStatus('broken')
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [rawFace])

  const avatarFace = rawFace && faceStatus === 'ready' ? rawFace : undefined

  const avatar = useMemo<Avatar | undefined>(() => {
    if (!address) return undefined
    return buildMinimalAvatar({ name: name ?? '', ethAddress: address, faceUrl: avatarFace })
  }, [address, name, avatarFace])

  return { avatar, avatarFace }
}

export { useCreatorAvatar }
export type { CreatorAvatarResult }
