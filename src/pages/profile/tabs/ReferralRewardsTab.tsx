import { useCallback, useMemo, useState } from 'react'
import { Button, CircularProgress, Typography } from 'decentraland-ui2'
import { useGetReferralProgressQuery } from '../../../features/profile/profile.referrals.client'
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

// Mirrors the thresholds in `decentraland/profile` (ReferralJourney/constants).
// Source of truth lives in the profile-dapp repo; copied here to compute
// progress / current tier locally instead of round-tripping through the API.
const TIER_THRESHOLDS = [5, 10, 20, 25, 30, 50, 60, 75, 100]

interface ReferralRewardsTabProps {
  address: string
}

function ReferralRewardsTab({ address }: ReferralRewardsTabProps) {
  const t = useFormatMessage()
  const { data, isLoading, error } = useGetReferralProgressQuery()
  const [copied, setCopied] = useState(false)

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/invite/${address}`
  }, [address])

  const handleCopy = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
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

  if (error || !data) {
    return (
      <ReferralRoot>
        <Typography variant="body2" color="text.disabled">
          {t('profile.referral_rewards.anonymous')}
        </Typography>
      </ReferralRoot>
    )
  }

  const { invitedUsersAccepted, rewardImages } = data
  const tiersUnlocked = TIER_THRESHOLDS.filter(threshold => invitedUsersAccepted >= threshold).length
  const nextThreshold = TIER_THRESHOLDS.find(threshold => invitedUsersAccepted < threshold)

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
          <CodePill>{inviteUrl}</CodePill>
          <Button variant="contained" color="primary" onClick={handleCopy}>
            {copied ? t('profile.referral_rewards.copied') : t('profile.referral_rewards.copy_invite_link')}
          </Button>
        </CodeRow>
        <StatsRow>
          <StatItem>
            <StatNumber>{invitedUsersAccepted}</StatNumber>
            <StatLabel>{t('profile.referral_rewards.confirmed')}</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{tiersUnlocked}</StatNumber>
            <StatLabel>{t('profile.referral_rewards.tiers_unlocked')}</StatLabel>
          </StatItem>
          {nextThreshold ? (
            <StatItem>
              <StatNumber>{nextThreshold - invitedUsersAccepted}</StatNumber>
              <StatLabel>{t('profile.referral_rewards.next_tier_at', { count: nextThreshold })}</StatLabel>
            </StatItem>
          ) : null}
        </StatsRow>
      </InviteCard>

      <RewardsSection>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('profile.referral_rewards.your_rewards')}
        </Typography>
        {rewardImages.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            {t('profile.referral_rewards.no_rewards')}
          </Typography>
        ) : (
          <RewardsGrid>
            {rewardImages.map(reward => {
              const threshold = TIER_THRESHOLDS[reward.tier - 1]
              const unlocked = typeof threshold === 'number' ? invitedUsersAccepted >= threshold : false
              return (
                <RewardCard key={`${reward.tier}-${reward.url}`} style={{ opacity: unlocked ? 1 : 0.4 }}>
                  <RewardImage src={reward.url} alt={`Tier ${reward.tier}`} loading="lazy" />
                  <RewardTier>{t('profile.referral_rewards.tier_label', { tier: reward.tier })}</RewardTier>
                  <RewardTitle>{t('profile.referral_rewards.tier_invites', { count: threshold ?? '?' })}</RewardTitle>
                  <Typography variant="body2" color={unlocked ? 'primary.main' : 'text.disabled'}>
                    {unlocked ? t('profile.referral_rewards.unlocked') : t('profile.referral_rewards.locked')}
                  </Typography>
                </RewardCard>
              )
            })}
          </RewardsGrid>
        )}
      </RewardsSection>
    </ReferralRoot>
  )
}

export { ReferralRewardsTab }
export type { ReferralRewardsTabProps }
