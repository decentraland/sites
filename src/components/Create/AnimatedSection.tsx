import { type ReactNode, memo } from 'react'
import { useInView } from 'react-intersection-observer'
import { styled } from 'decentraland-ui2'
import { useSectionViewedTracking } from '../../hooks/useSectionViewedTracking'
import type { SectionViewedTrack } from '../../modules/segment'

const RevealSection = styled('section')({
  opacity: 0,
  transition: 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.3s',
  transform: 'translate(0, 100px)',
  ['&.visible']: {
    opacity: 1,
    transform: 'translate(0, 0)'
  }
})

type AnimatedSectionProps = {
  children: ReactNode
  className?: string
  threshold?: number
  /**
   * When set, fires the `Section Viewed` event the first time this section
   * scrolls into view (see `useSectionViewedTracking`). Left unset for purely
   * decorative wrappers that shouldn't emit analytics.
   */
  trackPlace?: SectionViewedTrack
}

const AnimatedSection = memo((props: AnimatedSectionProps) => {
  const { children, className, threshold = 0.1, trackPlace } = props
  const { ref, inView } = useInView({ triggerOnce: true, threshold })

  useSectionViewedTracking(trackPlace, inView)

  return (
    <RevealSection ref={ref} className={`${inView ? 'visible' : ''} ${className ?? ''}`}>
      {children}
    </RevealSection>
  )
})

AnimatedSection.displayName = 'AnimatedSection'

export { AnimatedSection }
