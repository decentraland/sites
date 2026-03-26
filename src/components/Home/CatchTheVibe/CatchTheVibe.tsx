import { memo } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { getEnv } from '../../../config/env'
import { useGetLandingSocialProofQuery } from '../../../features/landing/landing.client'
import {
  CardsRow,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
  MobileCarouselContainer,
  PersonaImage,
  UserAvatar,
  UserInfo,
  UserName,
  VideoCard,
  VideoCardFooter,
  VideoElement
} from './CatchTheVibe.styled'

interface VideoItem {
  video?: { url: string }
  userName?: string
  userAvatar?: { url: string }
}

const VideoCardContent = ({ item }: { item: VideoItem }) => (
  <VideoCard>
    <VideoElement autoPlay loop muted playsInline src={item.video?.url} />
    {item.userName && (
      <VideoCardFooter>
        <UserInfo>
          {item.userAvatar?.url && <UserAvatar src={item.userAvatar.url} alt={item.userName} />}
          <UserName>{item.userName}</UserName>
        </UserInfo>
      </VideoCardFooter>
    )}
  </VideoCard>
)

const CatchTheVibe = memo(() => {
  const isConfigured = !!getEnv('CONTENTFUL_HOMEPAGE_CATCH_THE_VIBE_ID')
  const { data, isLoading } = useGetLandingSocialProofQuery(undefined, { skip: !isConfigured })

  const videoItems = (data?.list?.filter(item => item.type === 'video').slice(0, 2) ?? []) as unknown as VideoItem[]

  if (!isConfigured || isLoading || videoItems.length === 0) {
    return null
  }

  return (
    <CatchTheVibeContainer>
      <CatchTheVibeTitle variant="h3">Catch the Vibe</CatchTheVibeTitle>

      {/* Desktop: 2 cards side by side */}
      <CardsRow>
        {videoItems.map((item, index) => (
          <VideoCardContent key={index} item={item} />
        ))}
      </CardsRow>

      {/* Mobile: carousel */}
      <MobileCarouselContainer>
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          spaceBetween={0}
          slidesPerView={1}
        >
          {videoItems.map((item, index) => (
            <SwiperSlide key={index}>
              <VideoCardContent item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </MobileCarouselContainer>

      <PersonaImage src="/persona.png" alt="" aria-hidden />
    </CatchTheVibeContainer>
  )
})

CatchTheVibe.displayName = 'CatchTheVibe'

export { CatchTheVibe }
