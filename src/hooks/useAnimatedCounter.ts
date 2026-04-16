import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from `from` to `to` over `duration` ms using easeOut.
 * Returns the current animated value.
 */
function useAnimatedCounter(to: number | null, from = 400000, duration = 1500): number | null {
  const [value, setValue] = useState<number | null>(null)
  const animRef = useRef<number>()

  useEffect(() => {
    if (to === null) return
    if (to <= from) {
      setValue(to)
      return
    }

    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress)
      const current = Math.round(from + (to - from) * eased)
      setValue(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [to, from, duration])

  return value
}

export { useAnimatedCounter }
