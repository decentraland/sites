import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { ReferralTier } from '../ReferralJourney/ReferralJourney.types'
import {
  CardContainer,
  CompletedIcon,
  GradientBorder,
  HeaderContainer,
  ReferralRewardCardContainer,
  ReferralRewardCardHeader,
  ReferralRewardCardTitle,
  RewardImage,
  RewardImageContainer,
  RewardRarity
} from './ReferralRewardCard.styled'

interface ReferralRewardCardProps extends ReferralTier {
  completed: boolean
}

const ReferralRewardCard = memo((props: ReferralRewardCardProps) => {
  const { invitesAccepted, rarity, completed, image } = props
  const t = useFormatMessage()

  return (
    <ReferralRewardCardContainer>
      <ReferralRewardCardHeader>
        <ReferralRewardCardTitle>{invitesAccepted}</ReferralRewardCardTitle>
      </ReferralRewardCardHeader>
      <GradientBorder completed={completed}>
        <CardContainer completed={completed} rarity={rarity}>
          <HeaderContainer>
            {rarity && (
              <RewardRarity rarity={rarity}>
                {rarity === 'SWAG' ? t('profile.referral_reward_card.swag') : rarity.toUpperCase()}
              </RewardRarity>
            )}
            <CompletedIcon>{completed ? <CheckRoundedIcon fontSize="small" /> : <LockRoundedIcon fontSize="small" />}</CompletedIcon>
          </HeaderContainer>
          <RewardImageContainer>
            <RewardImage completed={completed} src={image} alt={t('profile.referral_reward_card.image_alt')} loading="lazy" />
          </RewardImageContainer>
        </CardContainer>
      </GradientBorder>
    </ReferralRewardCardContainer>
  )
})

export { ReferralRewardCard }
export type { ReferralRewardCardProps }
