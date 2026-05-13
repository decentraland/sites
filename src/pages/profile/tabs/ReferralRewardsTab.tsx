import { useCallback, useState } from 'react'
import { Button, CircularProgress, Typography } from 'decentraland-ui2'
import { useGetReferralStateQuery } from '../../../features/profile/profile.referrals.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  CodePill,
  CodeRow,
  InviteCard,
  ReferralRoot,
  RewardCard,
  RewardImage,
  RewardTier,
  RewardTitle,
  RewardsGrid,
  RewardsSection,
  StatItem,
  StatLabel,
  StatNumber,
  StatsRow
} from './ReferralRewardsTab.styled'

interface ReferralRewardsTabProps {
  address: string
}

function ReferralRewardsTab({ address }: ReferralRewardsTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetReferralStateQuery({ address })
  const [copied, setCopied] = useState(false)

  const inviteCode = data?.data.inviteCode ?? ''
  const inviteUrl = data?.data.inviteUrl ?? ''

  const handleCopy = useCallback(() => {
    if (!inviteUrl || typeof navigator === 'undefined' || !navigator.clipboard) return
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [inviteUrl])

  if (isLoading) {
    return (
      <ReferralRoot>
        <CircularProgress size={28} />
      </ReferralRoot>
    )
  }

  if (!data) {
    return (
      <ReferralRoot>
        <Typography variant="body2" color="text.disabled">
          {t('profile.referral_rewards.anonymous')}
        </Typography>
      </ReferralRoot>
    )
  }

  const { invitedCount, confirmedCount, rewards } = data.data

  return (
    <ReferralRoot>
      <InviteCard>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('profile.referral_rewards.invite_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('profile.referral_rewards.invite_subtitle')}
        </Typography>
        <CodeRow>
          <CodePill>{inviteCode || '—'}</CodePill>
          <Button variant="contained" color="primary" onClick={handleCopy} disabled={!inviteUrl}>
            {copied ? t('profile.referral_rewards.copied') : t('profile.referral_rewards.copy_invite_link')}
          </Button>
        </CodeRow>
        <StatsRow>
          <StatItem>
            <StatNumber>{invitedCount}</StatNumber>
            <StatLabel>{t('profile.referral_rewards.invited')}</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{confirmedCount}</StatNumber>
            <StatLabel>{t('profile.referral_rewards.confirmed')}</StatLabel>
          </StatItem>
        </StatsRow>
      </InviteCard>

      <RewardsSection>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('profile.referral_rewards.your_rewards')}
        </Typography>
        {rewards.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            {t('profile.referral_rewards.no_rewards')}
          </Typography>
        ) : (
          <RewardsGrid>
            {rewards.map(reward => (
              <RewardCard key={reward.id}>
                {reward.imageUrl ? <RewardImage src={reward.imageUrl} alt={reward.description} loading="lazy" /> : null}
                <RewardTier>{reward.tier}</RewardTier>
                <RewardTitle>{reward.description}</RewardTitle>
                <Typography variant="body2" color={reward.claimed ? 'text.disabled' : 'primary.main'}>
                  {reward.claimed ? t('profile.referral_rewards.claimed') : t('profile.referral_rewards.unlocked')}
                </Typography>
              </RewardCard>
            ))}
          </RewardsGrid>
        )}
      </RewardsSection>
    </ReferralRoot>
  )
}

export { ReferralRewardsTab }
export type { ReferralRewardsTabProps }
