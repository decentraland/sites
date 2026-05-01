import { useEffect, useState } from 'react'
import { enrichWearables, fetchImageById } from '../features/reels'
import type { Image } from '../features/reels'

interface ReelImageState {
  image: Image | null
  isLoading: boolean
  error: Error | null
}

const useReelImageById = (id: string | undefined): ReelImageState => {
  const [state, setState] = useState<ReelImageState>({
    image: null,
    isLoading: Boolean(id),
    error: null
  })

  useEffect(() => {
    if (!id) {
      setState({ image: null, isLoading: false, error: null })
      return undefined
    }

    const controller = new AbortController()
    setState({ image: null, isLoading: true, error: null })

    void (async () => {
      try {
        const image = await fetchImageById(id, controller.signal)
        if (controller.signal.aborted) return
        const enrichedUsers = await enrichWearables(image.metadata.visiblePeople, controller.signal)
        if (controller.signal.aborted) return
        setState({
          image: { ...image, metadata: { ...image.metadata, visiblePeople: enrichedUsers } },
          isLoading: false,
          error: null
        })
      } catch (err) {
        if (controller.signal.aborted) return
        setState({ image: null, isLoading: false, error: err instanceof Error ? err : new Error(String(err)) })
      }
    })()

    return () => controller.abort()
  }, [id])

  return state
}

export { useReelImageById }
