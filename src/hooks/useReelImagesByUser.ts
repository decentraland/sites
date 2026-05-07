import { useEffect, useState } from 'react'
import { fetchImagesByUser } from '../features/media/reels'
import type { FetchListOptions, Image } from '../features/media/reels'

interface ReelImagesState {
  images: Image[]
  total: number
  isLoading: boolean
  error: Error | null
}

const useReelImagesByUser = (address: string | undefined, options: FetchListOptions): ReelImagesState => {
  const [state, setState] = useState<ReelImagesState>({
    images: [],
    total: 0,
    isLoading: Boolean(address),
    error: null
  })

  useEffect(() => {
    if (!address) {
      setState({ images: [], total: 0, isLoading: false, error: null })
      return undefined
    }

    const controller = new AbortController()
    setState({ images: [], total: 0, isLoading: true, error: null })

    void (async () => {
      try {
        const result = await fetchImagesByUser(address, options, controller.signal)
        if (controller.signal.aborted) return
        setState({
          images: result.images,
          total: result.maxImages ?? result.images.length,
          isLoading: false,
          error: null
        })
      } catch (err) {
        if (controller.signal.aborted) return
        setState({ images: [], total: 0, isLoading: false, error: err instanceof Error ? err : new Error(String(err)) })
      }
    })()

    return () => controller.abort()
  }, [address, options.limit, options.offset])

  return state
}

export { useReelImagesByUser }
