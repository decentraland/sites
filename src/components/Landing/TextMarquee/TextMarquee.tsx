import * as React from 'react'
import Marquee from 'react-fast-marquee'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { ContentfulTextMarqueeEntry } from '../../../features/landing/landing.types'
import { TextMarqueeSection } from './TextMarquee.styled'

const TextMarquee = React.memo((props: Pick<ContentfulTextMarqueeEntry, 'text'>) => {
  const { text } = props
  const isMobile = useMobileMediaQuery()
  return (
    <TextMarqueeSection>
      <Marquee
        speed={50}
        gradient={false}
        style={{
          fontSize: isMobile ? '40px' : '37.6px',
          fontWeight: 600,
          lineHeight: isMobile ? '50px' : '46.44px'
        }}
      >
        {text.text}
      </Marquee>
    </TextMarqueeSection>
  )
})

export { TextMarquee }
