import { memo } from 'react'
import { default as marquee } from 'react-fast-marquee'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { ContentfulTextMarqueeEntry } from '../../../features/landing/landing.types'
import { TextMarqueeSection } from './TextMarquee.styled'

const MarqueeComponent = marquee

const TextMarquee = memo((props: Pick<ContentfulTextMarqueeEntry, 'text'>) => {
  const { text } = props
  const isMobile = useMobileMediaQuery()
  return (
    <TextMarqueeSection>
      <MarqueeComponent
        speed={50}
        gradient={false}
        style={{
          fontSize: isMobile ? '40px' : '37.6px',
          fontWeight: 600,
          lineHeight: isMobile ? '50px' : '46.44px'
        }}
      >
        {text.text}
      </MarqueeComponent>
    </TextMarqueeSection>
  )
})

export { TextMarquee }
