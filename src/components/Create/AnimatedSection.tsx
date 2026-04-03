import { type ReactNode, memo } from 'react'
import { useInView } from 'react-intersection-observer'
import { styled } from 'decentraland-ui2'

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
}

const AnimatedSection = memo(({ children, className, threshold = 0.1 }: AnimatedSectionProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold })

  return (
    <RevealSection ref={ref} className={`${inView ? 'visible' : ''} ${className ?? ''}`}>
      {children}
    </RevealSection>
  )
})

AnimatedSection.displayName = 'AnimatedSection'

export { AnimatedSection }
