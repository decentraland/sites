import { memo, useCallback, useEffect, useRef, useState } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Avatar } from '@dcl/schemas'
import { AvatarFace } from 'decentraland-ui2'
import { catchTheVibeContent } from '../../../data/static-content'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import {
  CardImage,
  CardsRow,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
  CommunityLabel,
  DurationText,
  MediaContainer,
  MobileCarouselContainer,
  MuteButton,
  PlayBadge,
  PlayIcon,
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
  userAddress?: string
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
  const [isMuted, setIsMuted] = useState(true)
  const [duration, setDuration] = useState<string | null>(null)
  const { data: profile } = useGetProfileQuery(item.userAddress, { skip: !item.userAddress })
  const fetchedAvatar = profile?.avatars?.[0] as Avatar | undefined
  // AvatarFace only passes through URLs starting with https://.
  const fallbackFace = `${window.location.origin}${item.userAvatarUrl}`.replace(/^http:\/\//, 'https://')

  // Use fetched profile if it has a face256 snapshot, otherwise fall back to static image
  const hasFace = !!fetchedAvatar?.avatar?.snapshots?.face256
  const avatar: Avatar = hasFace
    ? fetchedAvatar
    : ({
        name: fetchedAvatar?.name ?? item.userName,
        ethAddress: item.userAddress ?? '',
        avatar: { snapshots: { face256: fallbackFace, body: '' } }
      } as Avatar)

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
      video.play()
    }
    setIsPlaying(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
    setIsPlaying(false)
  }, [])

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }, [])

  return (
    <VideoCard onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <MediaContainer>
        <CardImage className="catch-vibe-image" src={item.imageUrl} alt={item.userName} loading="lazy" width={680} height={382} />
        <VideoElement className="catch-vibe-video" ref={videoRef} loop muted playsInline preload="metadata" src={item.videoUrl} />
        {!isPlaying && (
          <PlayBadge>
            <PlayIcon />
            <DurationText>{duration ?? '0:00'}</DurationText>
          </PlayBadge>
        )}
        {isPlaying && (
          <MuteButton onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🔊'}
          </MuteButton>
        )}
      </MediaContainer>
      <VideoCardFooter>
        <UserInfo>
          <AvatarFace size="small" avatar={avatar} />
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
        <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop slidesPerView={1} spaceBetween={0}>
          {catchTheVibeContent.cards.map((item, index) => (
            <SwiperSlide key={index}>
              <VideoCardContent item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </MobileCarouselContainer>
    </CatchTheVibeContainer>
  )
})

CatchTheVibe.displayName = 'CatchTheVibe'

export { CatchTheVibe }
