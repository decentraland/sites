import * as React from 'react'
import { useCallback } from 'react'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { isWebpSupported, useImageOptimization } from '../../../hooks/contentful'
import { TrendingNewsSlideProps } from './TrendingNewsSlide.types'
import {
  TrendingNewsSlideActionsContainer,
  TrendingNewsSlide as TrendingNewsSlideBox,
  TrendingNewsSlideButton,
  TrendingNewsSlideContainer,
  TrendingNewsSlideDescriptionContainer,
  TrendingNewsSlideImageContainer,
  TrendingNewsSlideSubtitle,
  TrendingNewsSlideTextWrapper,
  TrendingNewsSlideTitle
} from './TrendingNewsSlide.styled'

const TrendingNewsSlide = React.memo((props: TrendingNewsSlideProps) => {
  const { title, subtitle, image, buttonLink, buttonLabel, id } = props

  const handleMainCTA = useTrackClick()

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      event.preventDefault()
      handleMainCTA(event)
      const href = (event.currentTarget as HTMLAnchorElement).href ?? buttonLink
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [buttonLink, handleMainCTA]
  )

  const imageOptimized = useImageOptimization(image.url)

  return (
    <TrendingNewsSlideContainer>
      <TrendingNewsSlideBox data-index={id}>
        <TrendingNewsSlideImageContainer
          imageUrl={(isWebpSupported() && imageOptimized.webp) || imageOptimized.jpg || imageOptimized.optimized}
        />
      </TrendingNewsSlideBox>
      <TrendingNewsSlideDescriptionContainer>
        <TrendingNewsSlideTextWrapper>
          <TrendingNewsSlideTitle variant="h3" sx={{ typography: { sx: 'h5' } }}>
            {title}
          </TrendingNewsSlideTitle>
          <TrendingNewsSlideSubtitle variant="h4" sx={{ typography: { sx: 'body1' } }}>
            {subtitle.subtitle}
          </TrendingNewsSlideSubtitle>
        </TrendingNewsSlideTextWrapper>
        <TrendingNewsSlideActionsContainer>
          <TrendingNewsSlideButton
            href={buttonLink}
            onClick={handleClick}
            color="secondary"
            variant="outlined"
            fullWidth={true}
            data-title={title}
            data-subtitle={subtitle.subtitle}
            data-image={image.url}
          >
            {buttonLabel}
          </TrendingNewsSlideButton>
        </TrendingNewsSlideActionsContainer>
      </TrendingNewsSlideDescriptionContainer>
    </TrendingNewsSlideContainer>
  )
})

export { TrendingNewsSlide }
