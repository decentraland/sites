import { useMemo } from 'react'
import { AllExperiences } from '../../components/whats-on/AllExperiences'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { LiveNow } from '../../components/whats-on/LiveNow'
import { PlaceDetailModal } from '../../components/whats-on/PlaceDetailModal'
import { Upcoming } from '../../components/whats-on/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/events'
import { useEventDeepLink } from '../../hooks/useEventDeepLink'
import { useLiveNowQueryParams } from '../../hooks/useLiveNowQueryParams'
import { usePlaceDeepLink } from '../../hooks/usePlaceDeepLink'
import topBackground from '../../images/whats-on/images/top_background.webp'
import { optimizedImageUrl } from '../../utils/imageUrl'
import { ContentWrapper, DeferredGroup, MainContainer, TopBackgroundImage } from './HomePage.styled'

// Mobile renders this 1×1 SVG so the browser never fetches the 250 KB
// top_background.webp on phones where the image is hidden anyway.
const TRANSPARENT_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>"

function HomePage() {
  const queryParams = useLiveNowQueryParams()
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery(queryParams)
  const event = useEventDeepLink()
  const place = usePlaceDeepLink()

  // Route the desktop background through Vercel's image optimizer so the raw
  // 1920×1080 WebP (~250 KB) collapses to ~80 KB. Kept inside the component so
  // `window.location` is only read at render time (browser-only path), not on
  // module evaluation.
  const optimizedTopBg = useMemo(() => optimizedImageUrl(topBackground, { width: 1920 }), [])

  return (
    <MainContainer>
      <picture>
        <source srcSet={optimizedTopBg} media="(min-width: 600px)" />
        <TopBackgroundImage
          src={TRANSPARENT_FALLBACK}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          width={1440}
          height={700}
        />
      </picture>
      <ContentWrapper>
        <LiveNow />
      </ContentWrapper>
      <DeferredGroup deferred={isLiveNowLoading}>
        <Upcoming />
        <AllExperiences />
      </DeferredGroup>
      <EventDetailModal open={event.isOpen} onClose={event.closeDeepLink} data={event.modalData} />
      <PlaceDetailModal open={place.isOpen && !event.isOpen} onClose={place.closeDeepLink} data={place.modalData} />
    </MainContainer>
  )
}

export { HomePage }
