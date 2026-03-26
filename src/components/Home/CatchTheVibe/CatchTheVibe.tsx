import { memo } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { catchTheVibeContent } from '../../../data/static-content'
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
  videoUrl: string
  userName: string
  userAvatarUrl: string
}

const VideoCardContent = ({ item }: { item: VideoItem }) => (
  <VideoCard>
    <VideoElement autoPlay loop muted playsInline preload="none" src={item.videoUrl} />
    <VideoCardFooter>
      <UserInfo>
        <UserAvatar src={item.userAvatarUrl} alt={item.userName} />
        <UserName>{item.userName}</UserName>
      </UserInfo>
    </VideoCardFooter>
  </VideoCard>
)

const CatchTheVibe = memo(() => {
  return (
    <CatchTheVibeContainer>
      <CatchTheVibeTitle variant="h3">{catchTheVibeContent.title}</CatchTheVibeTitle>
      <CardsRow>
        {catchTheVibeContent.videos.map((item, index) => (
          <VideoCardContent key={index} item={item} />
        ))}
      </CardsRow>
      <MobileCarouselContainer>
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          spaceBetween={0}
          slidesPerView={1}
        >
          {catchTheVibeContent.videos.map((item, index) => (
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
