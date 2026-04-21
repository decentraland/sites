import { useEffect, useMemo, useState } from 'react'
import type { Avatar } from '@dcl/schemas'
import { buildMinimalAvatar } from '../utils/avatar'
import { getProfileFaceUrl } from '../utils/profileFace'

type CreatorAvatarResult = {
  avatar: Avatar | undefined
  avatarFace: string | undefined
}

// Event/place creator addresses come from external sources (places/events API)
// and frequently lack a deployed profile image. We build the face URL directly
// (no lambdas call, which avoids 404s that fail the Lighthouse errors-in-console
// audit) and probe it once per URL. Expiry means a transient CDN blip does not
// permanently blacklist the URL for the rest of the session.
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

function useCreatorAvatar(address: string | undefined, name?: string): CreatorAvatarResult {
  const rawFace = address ? getProfileFaceUrl(address) : undefined
  const [broken, setBroken] = useState<boolean>(() => (rawFace ? isFaceBroken(rawFace) : false))

  useEffect(() => {
    if (!rawFace) {
      setBroken(false)
      return
    }
    if (isFaceBroken(rawFace)) {
      setBroken(true)
      return
    }
    setBroken(false)
    const img = new Image()
    let cancelled = false
    img.onerror = () => {
      if (cancelled) return
      markFaceBroken(rawFace)
      setBroken(true)
    }
    img.src = rawFace
    return () => {
      cancelled = true
      img.onerror = null
      img.src = ''
    }
  }, [rawFace])

  const avatarFace = !rawFace || broken ? undefined : rawFace

  const avatar = useMemo<Avatar | undefined>(() => {
    if (!address) return undefined
    return buildMinimalAvatar({ name: name ?? '', ethAddress: address, faceUrl: avatarFace })
  }, [address, name, avatarFace])

  return { avatar, avatarFace }
}

export { useCreatorAvatar }
export type { CreatorAvatarResult }
