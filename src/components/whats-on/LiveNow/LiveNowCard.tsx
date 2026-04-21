import { memo, useCallback } from 'react'
import type { Avatar } from '@dcl/schemas'
import { AvatarFace, BadgeGroup, JumpInIcon, LiveBadge, Typography, UserCountBadge } from 'decentraland-ui2'
import type { LiveNowCard as LiveNowCardData } from '../../../features/whats-on-events'
import {
  AvatarLink,
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
  avatar?: Avatar
  eager?: boolean
  onClick: (card: LiveNowCardData) => void
}

const LiveNowCard = memo(({ card, avatar, eager = false, onClick }: LiveNowCardProps) => {
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
            src={card.image}
            alt=""
            width={500}
            height={329}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
            decoding={eager ? 'sync' : 'async'}
          />
        </MediaBox>
        <CardBody>
          <SceneInfo>
            <SceneTitle variant="h6" gutterBottom>
              {card.title}
            </SceneTitle>
            {avatar && (
              <AvatarRow>
                <AvatarFace size="small" avatar={avatar} />
                <AvatarTextContainer>
                  <Typography variant="body2">
                    by{' '}
                    {avatar.name ? (
                      <AvatarLink href={`https://decentraland.org/profile/accounts/${avatar.ethAddress}`}>{avatar.name}</AvatarLink>
                    ) : (
                      <strong>{avatar.ethAddress ? `${avatar.ethAddress.slice(0, 6)}…${avatar.ethAddress.slice(-4)}` : 'Unknown'}</strong>
                    )}
                  </Typography>
                </AvatarTextContainer>
              </AvatarRow>
            )}
          </SceneInfo>
          <JumpInButtonContainer>
            <JumpInButton>
              <span>JUMP IN</span>
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
