import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Avatar } from '@dcl/schemas'
import { AvatarFace, DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { catchTheVibeContent } from '../../../data/static-content'
import { useGetProfileQuery } from '../../../features/social/profile/profile.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import { Carousel } from '../../Carousel/Carousel'
import { HangOutButton } from '../shared/HangOutButton.styled'
import {
  CardImage,
  CardsRow,
  CatchTheVibeContainer,
  CatchTheVibeTitle,
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
  const l = useFormatMessage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [duration, setDuration] = useState<string | null>(null)
  const { data: profile } = useGetProfileQuery(item.userAddress, { skip: !item.userAddress })
  const fetchedAvatar = profile?.avatars?.[0] as Avatar | undefined
  // AvatarFace only passes through URLs starting with https://.
  const fallbackFace = item.userAvatarUrl.startsWith('http')
    ? item.userAvatarUrl
    : `${window.location.origin}${item.userAvatarUrl}`.replace(/^http:\/\//, 'https://')

  // Use fetched profile if it has a face256 snapshot, otherwise fall back to static image
  const hasFace = !!fetchedAvatar?.avatar?.snapshots?.face256
  const avatar: Avatar = hasFace
    ? fetchedAvatar
    : ({
        name: fetchedAvatar?.name ?? item.userName,
        ethAddress: item.userAddress ?? '',
        avatar: { snapshots: { face256: fallbackFace, body: '' } }
      } as Avatar)

  const avatarBackgroundColor = useMemo(
    () =>
      getAvatarBackgroundColor(
        getDisplayName({
          name: fetchedAvatar?.name ?? item.userName,
          hasClaimedName: fetchedAvatar?.hasClaimedName,
          ethAddress: fetchedAvatar?.ethAddress ?? item.userAddress
        })
      ),
    [fetchedAvatar?.name, fetchedAvatar?.hasClaimedName, fetchedAvatar?.ethAddress, item.userName, item.userAddress]
  )

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

  const isTouchDevice = typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches

  const handleMobilePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.muted = false
      setIsMuted(false)
      video.play().catch(() => {
        // iOS fallback: if unmuted play fails, retry muted
        video.muted = true
        setIsMuted(true)
        video.play().catch(e => console.warn('Video playback failed:', e))
      })
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Pause video when it scrolls out of view (e.g. swiper slide change)
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isTouchDevice) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !video.paused) {
          video.pause()
          video.currentTime = 0
          setIsPlaying(false)
          setIsMuted(true)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [isTouchDevice])

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
      video.muted = true
    }
    setIsPlaying(false)
    setIsMuted(true)
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
    <VideoCard
      className={isPlaying ? 'playing' : ''}
      onMouseEnter={isTouchDevice ? undefined : handleMouseEnter}
      onMouseLeave={isTouchDevice ? undefined : handleMouseLeave}
      onClick={isTouchDevice ? handleMobilePlay : undefined}
    >
      <MediaContainer>
        <CardImage className="catch-vibe-image" src={item.imageUrl} alt={item.userName} loading="lazy" width={680} height={382} />
        <VideoElement
          className="catch-vibe-video"
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          poster={item.imageUrl}
          src={item.videoUrl}
        />
        {!isPlaying && (
          <PlayBadge>
            <PlayIcon />
            <DurationText>{duration ?? '0:00'}</DurationText>
          </PlayBadge>
        )}
        {isPlaying && (
          <MuteButton onClick={toggleMute} aria-label={isMuted ? l('page.home.catch_the_vibe.unmute') : l('page.home.catch_the_vibe.mute')}>
            {isMuted ? '🔇' : '🔊'}
          </MuteButton>
        )}
      </MediaContainer>
      <VideoCardFooter>
        <UserInfo $avatarBackgroundColor={avatarBackgroundColor}>
          <AvatarFace size="small" avatar={avatar} />
          <UserName>{item.userName}</UserName>
        </UserInfo>
      </VideoCardFooter>
    </VideoCard>
  )
}

const CatchTheVibe = memo(() => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  return (
    <CatchTheVibeContainer>
      <img
        src={assetUrl('/ellipse_gradient.webp')}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '60%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center left',
          pointerEvents: 'none',
          zIndex: 0
        }}
        className="desktop-only-ellipse"
      />
      <CatchTheVibeTitle variant="h3">{l('page.home.catch_the_vibe.title')}</CatchTheVibeTitle>
      <CardsRow>
        {catchTheVibeContent.cards.map((item, index) => (
          <VideoCardContent key={index} item={item} />
        ))}
      </CardsRow>
      <MobileCarouselContainer>
        <Carousel
          items={catchTheVibeContent.cards}
          renderItem={item => <VideoCardContent item={item} />}
          keyExtractor={item => item.userName}
          autoplayDelay={0}
        />
      </MobileCarouselContainer>
      <HangOutButton
        variant="contained"
        onClick={e => {
          onClickHandle(e)
          handleClick(e)
        }}
        data-place={SectionViewedTrack.LANDING_CATCH_THE_VIBE}
        data-event="click"
        endIcon={<JumpInIcon />}
      >
        {l('page.home.hang_out_now')}
      </HangOutButton>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </CatchTheVibeContainer>
  )
})

CatchTheVibe.displayName = 'CatchTheVibe'

export { CatchTheVibe }
