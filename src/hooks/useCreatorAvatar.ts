import { useEffect, useMemo, useState } from 'react'
import type { Avatar } from '@dcl/schemas'
import { getProfileFaceUrl } from '../utils/profileFace'

type CreatorAvatarResult = {
  avatar: Avatar | undefined
  avatarFace: string | undefined
}

// NOTE: deliberately does NOT hit `/lambdas/profiles/{address}`. Event/place creator
// addresses come from external sources (places/events API) and frequently lack a
// catalyst profile, which produces browser-level 404s that fail the Lighthouse
// "errors-in-console" audit. We build the face URL directly from the address and
// let the browser validate it; broken URLs are cached so sibling cards don't retry.
const BROKEN_CACHE_MAX_SIZE = 500
const brokenFaceUrls = new Set<string>()

function markFaceAsBroken(url: string): void {
  if (brokenFaceUrls.size >= BROKEN_CACHE_MAX_SIZE) {
    const oldest = brokenFaceUrls.values().next().value
    if (oldest !== undefined) brokenFaceUrls.delete(oldest)
  }
  brokenFaceUrls.add(url)
}

function useCreatorAvatar(address: string | undefined, name?: string): CreatorAvatarResult {
  const rawFace = address ? getProfileFaceUrl(address) : undefined
  const [broken, setBroken] = useState<boolean>(() => (rawFace ? brokenFaceUrls.has(rawFace) : false))

  useEffect(() => {
    if (!rawFace) {
      setBroken(false)
      return
    }
    if (brokenFaceUrls.has(rawFace)) {
      setBroken(true)
      return
    }
    setBroken(false)
    const img = new Image()
    let cancelled = false
    img.onerror = () => {
      if (cancelled) return
      markFaceAsBroken(rawFace)
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
    return {
      name: name ?? '',
      ethAddress: address,
      avatar: { snapshots: { face256: avatarFace ?? '', body: '' } }
    } as unknown as Avatar
  }, [address, name, avatarFace])

  return { avatar, avatarFace }
}

export { useCreatorAvatar }
export type { CreatorAvatarResult }
