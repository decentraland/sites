import { memo, useCallback, useEffect, useRef, useState } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { catchTheVibeContent } from '../../../data/static-content'
import {
  CardImage,
  CardsRow,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
  CommunityLabel,
  DurationText,
  GreenDot,
  MediaContainer,
  MobileCarouselContainer,
  PersonaImage,
  PlayBadge,
  PlayIcon,
  ProfilePic,
  UserAvatar,
  UserInfo,
  UserName,
  VideoCard,
  VideoCardFooter,
  VideoElement
} from './CatchTheVibe.styled'

interface CardItem {
  imageUrl: string
  videoUrl: string
  userName: string
  userAvatarUrl: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const VideoCardContent = ({ item }: { item: CardItem }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleLoaded = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(formatDuration(video.duration))
      }
    }
    video.addEventListener('loadedmetadata', handleLoaded)
    return () => video.removeEventListener('loadedmetadata', handleLoaded)
  }, [])

  const handleMouseEnter = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.muted = false
      video.play()
    }
    setIsPlaying(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
      video.muted = true
    }
    setIsPlaying(false)
  }, [])

  return (
    <VideoCard onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <MediaContainer>
        <CardImage className="catch-vibe-image" src={item.imageUrl} alt={item.userName} loading="lazy" />
        <VideoElement className="catch-vibe-video" ref={videoRef} loop muted playsInline preload="metadata" src={item.videoUrl} />
        {!isPlaying && (
          <PlayBadge>
            <PlayIcon />
            <DurationText>{duration ?? '0:00'}</DurationText>
          </PlayBadge>
        )}
      </MediaContainer>
      <VideoCardFooter>
        <UserInfo>
          <ProfilePic>
            <GreenDot>
              <UserAvatar src={item.userAvatarUrl} alt={item.userName} />
            </GreenDot>
          </ProfilePic>
          <UserName>{item.userName}</UserName>
        </UserInfo>
        <CommunityLabel>Community Member</CommunityLabel>
      </VideoCardFooter>
    </VideoCard>
  )
}

const CatchTheVibe = memo(() => {
  return (
    <CatchTheVibeContainer>
      <CatchTheVibeTitle variant="h3">{catchTheVibeContent.title}</CatchTheVibeTitle>
      <CardsRow>
        {catchTheVibeContent.cards.map((item, index) => (
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
          {catchTheVibeContent.cards.map((item, index) => (
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
