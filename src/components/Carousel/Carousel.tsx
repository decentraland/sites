import { useCallback, useEffect, useRef, useState } from 'react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { CarouselDot, CarouselDots, CarouselSlide, CarouselTrack, CarouselWrapper, NavButtonNext, NavButtonPrev } from './Carousel.styled'

const SWIPE_THRESHOLD = 50

interface CarouselProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
  /** Autoplay interval in ms. Pass 0 to disable. Default: 4000 */
  autoplayDelay?: number
  /** Desktop slide width in px. Default: 750 */
  slideWidth?: number
  /** CSS aspect-ratio applied on desktop/tablet slides. E.g. "750 / 370" */
  slideAspectRatio?: string
  /** Align items on the track. Default: 'stretch' */
  alignItems?: 'stretch' | 'center' | 'flex-start' | 'flex-end'
  className?: string
}

function Carousel<T>({
  items,
  renderItem,
  keyExtractor,
  autoplayDelay = 4000,
  slideWidth: desktopSlideWidth = 750,
  slideAspectRatio,
  alignItems: trackAlignItems = 'stretch',
  className
}: CarouselProps<T>) {
  const isDesktop = useDesktopMediaQuery()
  const isMobile = useMediaQuery('(max-width: 599px)')
  const total = items.length

  // Triple the items for seamless infinite loop: [clone, real, clone].
  // Neighboring slides around any position match their real counterparts,
  // so the instant snap after a clone is visually imperceptible.
  //
  // NOTE: A modulo-based approach (rendering only one copy and wrapping indices)
  // was considered but is impractical here. The carousel relies on CSS
  // `transform: translateX()` with a `transition` to animate between slides.
  // The browser needs real DOM elements at adjacent positions so that the
  // transition can smoothly slide between them. After reaching a clone zone,
  // `handleTransitionEnd` instantly snaps `pos` back into the real range
  // (with transitions disabled), making the reset invisible. Without the
  // extra DOM elements the transition would have no target to animate toward.
  const slides = [...items, ...items, ...items]

  // pos indexes into `slides`. Real items sit at total..2*total-1.
  const [pos, setPos] = useState(total)
  const [animated, setAnimated] = useState(true)
  const [dragOffset, setDragOffset] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<ReturnType<typeof setInterval>>()
  const isMovingRef = useRef(false)
  const touchStartXRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const wasDragRef = useRef(false)

  // ── Measure wrapper ─────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Slide geometry ──────────────────────────────────────────────────
  const slideWidth = isDesktop ? desktopSlideWidth : isMobile ? viewportWidth : viewportWidth * 0.7
  const gap = isDesktop ? 24 : isMobile ? 0 : 16
  const step = slideWidth + gap
  const translateX = viewportWidth / 2 - slideWidth / 2 - pos * step + dragOffset
  const realIndex = ((pos % total) + total) % total

  // ── Navigation ──────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (isMovingRef.current) return
    isMovingRef.current = true
    setAnimated(true)
    setPos(p => p + 1)
  }, [])

  const goPrev = useCallback(() => {
    if (isMovingRef.current) return
    isMovingRef.current = true
    setAnimated(true)
    setPos(p => p - 1)
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      if (isMovingRef.current) return
      isMovingRef.current = true
      setAnimated(true)
      setPos(total + index)
      clearInterval(autoRef.current)
    },
    [total]
  )

  // Snap back into the real range after reaching a clone zone.
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== e.currentTarget) return
      isMovingRef.current = false
      setPos(p => {
        if (p >= 2 * total) {
          setAnimated(false)
          return p - total
        }
        if (p < total) {
          setAnimated(false)
          return p + total
        }
        return p
      })
    },
    [total]
  )

  // Re-enable transitions after an instant snap
  useEffect(() => {
    if (!animated) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimated(true))
      })
      return () => cancelAnimationFrame(id)
    }
  }, [animated])

  // ── Autoplay ────────────────────────────────────────────────────────
  const startAutoplay = useCallback(() => {
    if (!autoplayDelay) return
    clearInterval(autoRef.current)
    autoRef.current = setInterval(() => {
      if (!isMovingRef.current) {
        isMovingRef.current = true
        setAnimated(true)
        setPos(p => p + 1)
      }
    }, autoplayDelay)
  }, [autoplayDelay])

  useEffect(() => {
    startAutoplay()
    return () => clearInterval(autoRef.current)
  }, [startAutoplay])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(autoRef.current)
      } else {
        startAutoplay()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [startAutoplay])

  // ── Shared drag end ─────────────────────────────────────────────────
  const endDrag = useCallback(() => {
    isDraggingRef.current = false
    const dx = dragOffsetRef.current
    dragOffsetRef.current = 0
    setDragOffset(0)
    setAnimated(true)

    if (dx < -SWIPE_THRESHOLD) {
      isMovingRef.current = true
      setPos(p => p + 1)
    } else if (dx > SWIPE_THRESHOLD) {
      isMovingRef.current = true
      setPos(p => p - 1)
    }

    startAutoplay()
  }, [startAutoplay])

  // ── Touch ───────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    dragOffsetRef.current = 0
    isDraggingRef.current = true
    setAnimated(false)
    clearInterval(autoRef.current)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    dragOffsetRef.current = e.touches[0].clientX - touchStartXRef.current
    setDragOffset(dragOffsetRef.current)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    endDrag()
  }, [endDrag])

  // ── Mouse drag ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    touchStartXRef.current = e.clientX
    dragOffsetRef.current = 0
    isDraggingRef.current = true
    wasDragRef.current = false
    setAnimated(false)
    clearInterval(autoRef.current)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - touchStartXRef.current
      dragOffsetRef.current = dx
      setDragOffset(dx)
      if (Math.abs(dx) > 5) wasDragRef.current = true
    }
    const onMouseUp = () => {
      if (!isDraggingRef.current) return
      endDrag()
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [endDrag])

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (wasDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
      wasDragRef.current = false
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <CarouselWrapper ref={wrapperRef} role="region" aria-roledescription="carousel" className={className}>
      <CarouselTrack
        style={{
          transform: `translateX(${translateX}px)`,
          transition: animated ? 'transform 0.4s ease' : 'none',
          gap,
          alignItems: trackAlignItems,
          visibility: viewportWidth > 0 ? 'visible' : 'hidden'
        }}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((item, i) => (
          <CarouselSlide
            key={`${keyExtractor(item)}-${i}`}
            className={i === pos ? 'active' : i === pos - 1 ? 'prev' : i === pos + 1 ? 'next' : ''}
            style={{
              width: slideWidth || undefined,
              aspectRatio: isMobile ? undefined : slideAspectRatio,
              transition: animated ? undefined : 'none'
            }}
          >
            {renderItem(item)}
          </CarouselSlide>
        ))}
      </CarouselTrack>

      <CarouselDots>
        {items.map((item, i) => (
          <CarouselDot
            key={keyExtractor(item)}
            className={i === realIndex ? 'active' : ''}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              if (i === realIndex) return
              goToSlide(i)
              startAutoplay()
            }}
          />
        ))}
      </CarouselDots>

      <NavButtonPrev
        className="carousel-nav"
        aria-label="Previous slide"
        onClick={() => {
          goPrev()
          startAutoplay()
        }}
      >
        &#8249;
      </NavButtonPrev>
      <NavButtonNext
        className="carousel-nav"
        aria-label="Next slide"
        onClick={() => {
          goNext()
          startAutoplay()
        }}
      >
        &#8250;
      </NavButtonNext>
    </CarouselWrapper>
  )
}

export { Carousel }
export type { CarouselProps }
