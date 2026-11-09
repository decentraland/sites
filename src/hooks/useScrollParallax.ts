import { useEffect, useRef } from 'react'

/**
 * Writes the element's scroll offset, scaled by `speed` and clamped to ±`limit` px, to the CSS
 * custom property `property` on that element, so its styles can move a decorative layer at a
 * different pace than the page. The clamp keeps a finite artwork covering its element however
 * far the page scrolls. Updates are batched to one per animation frame, and the offset stays at
 * 0 for visitors who ask for reduced motion.
 */
function useScrollParallax<T extends HTMLElement>(property: string, speed: number, limit: number) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const update = () => {
      frame = 0
      const raw = -element.getBoundingClientRect().top * speed
      const offset = reducedMotion.matches ? 0 : Math.max(-limit, Math.min(limit, raw))
      element.style.setProperty(property, `${offset}px`)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    reducedMotion.addEventListener('change', schedule)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      reducedMotion.removeEventListener('change', schedule)
      element.style.removeProperty(property)
    }
  }, [property, speed, limit])

  return ref
}

export { useScrollParallax }
