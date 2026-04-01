import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { weeklyRitualsContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  CardImage,
  CarouselDot,
  CarouselDots,
  CarouselSlide,
  CarouselTrack,
  CarouselWrapper,
  MobileCardImage,
  NavButtonNext,
  NavButtonPrev,
  SectionTitle,
  WeeklyRitualsContainer,
  WeeklyRitualsOuter
} from './WeeklyRituals.styled'

const cards = weeklyRitualsContent.cards
const TOTAL = cards.length
const AUTO_DELAY = 4000
const SWIPE_THRESHOLD = 50

// Triple the cards for seamless infinite loop: [clone, real, clone]
// This ensures that when snapping from a clone to a real card, the
// neighboring slides remain identical, preventing a visible flash.
const slides = [...cards, ...cards, ...cards]

const WeeklyRituals = memo(() => {
  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()
  const isMobile = useMediaQuery('(max-width: 599px)')

  // pos indexes into `slides`. Real cards sit at TOTAL..2*TOTAL-1.
  const [pos, setPos] = useState(TOTAL)
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

  // Measure wrapper width
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Slide dimensions
  const slideWidth = isDesktop ? 750 : isMobile ? viewportWidth : viewportWidth * 0.7
  const gap = isDesktop ? 24 : isMobile ? 0 : 16
  const step = slideWidth + gap

  // Center the slide at `pos` within the wrapper
  const translateX = viewportWidth / 2 - slideWidth / 2 - pos * step + dragOffset

  // Logical card index (0-based) for the dots
  const realIndex = ((pos % TOTAL) + TOTAL) % TOTAL

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

  const goToSlide = useCallback((index: number) => {
    if (isMovingRef.current) return
    isMovingRef.current = true
    setAnimated(true)
    setPos(TOTAL + index)
    clearInterval(autoRef.current)
  }, [])

  // After the CSS transition ends, snap back into the real range if we
  // landed on a clone. The snap is instant (animated = false) and
  // visually identical because neighboring slides are the same.
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return
    isMovingRef.current = false
    setPos(p => {
      if (p >= 2 * TOTAL) {
        setAnimated(false)
        return p - TOTAL
      }
      if (p < TOTAL) {
        setAnimated(false)
        return p + TOTAL
      }
      return p
    })
  }, [])

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
    clearInterval(autoRef.current)
    autoRef.current = setInterval(() => {
      if (!isMovingRef.current) {
        isMovingRef.current = true
        setAnimated(true)
        setPos(p => p + 1)
      }
    }, AUTO_DELAY)
  }, [])

  useEffect(() => {
    startAutoplay()
    return () => clearInterval(autoRef.current)
  }, [startAutoplay])

  // Pause while the tab is hidden so advances don't queue up
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

  // ── Shared drag end logic ───────────────────────────────────────────
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

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    dragOffsetRef.current = 0
    isDraggingRef.current = true
    setAnimated(false)
    clearInterval(autoRef.current)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.touches[0].clientX - touchStartXRef.current
    dragOffsetRef.current = dx
    setDragOffset(dx)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    endDrag()
  }, [endDrag])

  // ── Mouse drag handlers ─────────────────────────────────────────────
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

  // Prevent link navigation after a mouse drag
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (wasDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
      wasDragRef.current = false
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <WeeklyRitualsOuter>
      <WeeklyRitualsContainer>
        <SectionTitle variant="h3">{l('page.home.weekly_rituals.title')}</SectionTitle>
        <CarouselWrapper ref={wrapperRef} role="region" aria-roledescription="carousel">
          <CarouselTrack
            style={{
              transform: `translateX(${translateX}px)`,
              transition: animated ? 'transform 0.4s ease' : 'none',
              gap,
              visibility: viewportWidth > 0 ? 'visible' : 'hidden'
            }}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((card, i) => (
              <CarouselSlide
                key={`${card.id}-${i}`}
                className={i === pos ? 'active' : i === pos - 1 ? 'prev' : i === pos + 1 ? 'next' : ''}
                style={{ width: slideWidth || undefined, transition: animated ? undefined : 'none' }}
              >
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  style={{ display: 'block', height: '100%' }}
                >
                  {isMobile ? (
                    <MobileCardImage src={card.mobileImageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
                  ) : (
                    <CardImage src={card.imageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
                  )}
                </a>
              </CarouselSlide>
            ))}
          </CarouselTrack>

          <CarouselDots>
            {cards.map((_, i) => (
              <CarouselDot
                key={i}
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
            className="weekly-rituals-nav"
            aria-label="Previous slide"
            onClick={() => {
              goPrev()
              startAutoplay()
            }}
          >
            &#8249;
          </NavButtonPrev>
          <NavButtonNext
            className="weekly-rituals-nav"
            aria-label="Next slide"
            onClick={() => {
              goNext()
              startAutoplay()
            }}
          >
            &#8250;
          </NavButtonNext>
        </CarouselWrapper>
      </WeeklyRitualsContainer>
    </WeeklyRitualsOuter>
  )
})

WeeklyRituals.displayName = 'WeeklyRituals'

export { WeeklyRituals }
