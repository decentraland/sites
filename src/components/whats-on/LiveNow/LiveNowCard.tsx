import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from '@dcl/hooks'
import { BadgeGroup, JumpInIcon, LiveBadge, Typography, UserCountBadge } from 'decentraland-ui2'
import type { LiveNowCard as LiveNowCardData } from '../../../features/whats-on-events'
import { getCreatorColor } from '../../../utils/creatorColor'
import { optimizedImageUrl } from '../../../utils/imageUrl'
import {
  AvatarFallback,
  AvatarImage,
  AvatarRow,
  AvatarTextContainer,
  BadgesOverlay,
  CardBody,
  CardRoot,
  JumpInButton,
  JumpInButtonContainer,
  LiveNowActionArea,
  MediaBox,
  MediaImage,
  SceneInfo,
  SceneTitle
} from './LiveNowCard.styled'

interface LiveNowCardProps {
  card: LiveNowCardData
  creatorName?: string
  creatorFaceUrl?: string
  eager?: boolean
  onClick: (card: LiveNowCardData) => void
}

const LiveNowCard = memo(({ card, creatorName, creatorFaceUrl, eager = false, onClick }: LiveNowCardProps) => {
  const { t } = useTranslation()
  const fallbackColor = getCreatorColor(card.creatorAddress)
  // Card images are 380×176 CSS pixels; serve at 750 px to cover 2× DPR and let
  // Vercel's image optimizer recompress the 1+ MB raw poster into ~80 KB WebP.
  const optimizedSrc = useMemo(() => optimizedImageUrl(card.image, { width: 750 }), [card.image])
  const handleClick = useCallback(() => {
    onClick(card)
  }, [onClick, card])

  return (
    <CardRoot>
      <LiveNowActionArea onClick={handleClick}>
        <BadgesOverlay>
          <BadgeGroup>
            {card.type === 'event' && <LiveBadge />}
            <UserCountBadge count={card.users} />
          </BadgeGroup>
        </BadgesOverlay>
        <MediaBox className="MuiCardMedia-root" role="img" aria-label={card.title}>
          <MediaImage
            src={optimizedSrc}
            alt=""
            width={500}
            height={329}
            loading={eager ? 'eager' : 'lazy'}
            fetchpriority={eager ? 'high' : undefined}
            decoding="async"
          />
        </MediaBox>
        <CardBody>
          <SceneInfo>
            <SceneTitle variant="h6" gutterBottom>
              {card.title}
            </SceneTitle>
            {creatorName && (
              <AvatarRow>
                {creatorFaceUrl ? (
                  <AvatarImage src={creatorFaceUrl} alt={creatorName} fallbackColor={fallbackColor} />
                ) : (
                  <AvatarFallback fallbackColor={fallbackColor} />
                )}
                <AvatarTextContainer>
                  <Typography variant="body2">
                    {t('live_now.by_prefix')}
                    <strong>{creatorName}</strong>
                  </Typography>
                </AvatarTextContainer>
              </AvatarRow>
            )}
          </SceneInfo>
          <JumpInButtonContainer>
            <JumpInButton>
              <span>{t('live_now.jump_in')}</span>
              <JumpInIcon />
            </JumpInButton>
          </JumpInButtonContainer>
        </CardBody>
      </LiveNowActionArea>
    </CardRoot>
  )
})

LiveNowCard.displayName = 'LiveNowCard'

export { LiveNowCard }
