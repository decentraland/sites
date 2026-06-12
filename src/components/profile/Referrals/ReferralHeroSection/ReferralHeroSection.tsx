import { memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import XIcon from '@mui/icons-material/X'
import { Box, InputAdornment, Menu, MenuItem, Tooltip, Typography, useTabletAndBelowMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  EnvelopeImage,
  EnvelopeImageContainer,
  EnvelopeShadow,
  HeroWrapper,
  HowItWorksButton,
  ReferralButton,
  ReferralContainer,
  ReferralInput,
  SectionContainer,
  Step,
  StepImage,
  StepNumber,
  StepText,
  StepTextContainer,
  StepsContainer,
  Subtitle,
  Title,
  TooltipLink
} from './ReferralHeroSection.styled'

interface ReferralHeroSectionProps {
  profileAddress: string
  avatarName?: string
  hasClaimedName?: boolean
}

const ENVELOPE_SRC = '/images/referrals/referral-envelope.webp'
const LOGO_POINTER_SRC = '/images/referrals/logo-with-pointer.webp'
const MEDAL_SRC = '/images/referrals/sports-medal.webp'

function shortenAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

const ReferralHeroSection = memo(({ profileAddress, avatarName, hasClaimedName }: ReferralHeroSectionProps) => {
  const t = useFormatMessage()
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false)
  const [anchorMenu, setAnchorMenu] = useState<HTMLElement | null>(null)
  const shareMenuOpen = Boolean(anchorMenu)
  const isTabletOrBelow = useTabletAndBelowMediaQuery()
  const [showSteps, setShowSteps] = useState(false)

  const inviteHandle = hasClaimedName && avatarName ? avatarName : profileAddress
  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/invite/${inviteHandle}`
  }, [inviteHandle])
  const inviteDisplay = hasClaimedName && avatarName ? avatarName : shortenAddress(profileAddress)

  const handleShareButtonClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isTabletOrBelow && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Decentraland Referral',
          text: t('profile.referral_hero_section.share_on_x_title'),
          url: inviteUrl
        })
      } else {
        setAnchorMenu(event.currentTarget)
      }
    },
    [isTabletOrBelow, inviteUrl, t]
  )

  const handleShareOnXClick = useCallback(() => {
    const tweet = encodeURIComponent(t('profile.referral_hero_section.share_on_x_title'))
    const link = encodeURIComponent(inviteUrl)
    window.open(`https://twitter.com/intent/tweet?text=${tweet}&url=${link}`, '_blank', 'noopener,noreferrer')
    setAnchorMenu(null)
  }, [inviteUrl, t])

  const handleCopyLink = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    void navigator.clipboard.writeText(inviteUrl)
    setCopyTooltipOpen(true)
    setTimeout(() => setCopyTooltipOpen(false), 2000)
    setAnchorMenu(null)
  }, [inviteUrl])

  return (
    <SectionContainer>
      <EnvelopeImageContainer>
        <EnvelopeShadow />
        <EnvelopeImage src={ENVELOPE_SRC} alt="Envelope" />
      </EnvelopeImageContainer>
      <HeroWrapper>
        <Title variant="h3">{t('profile.referral_hero_section.title')}</Title>
        <Subtitle>
          {t('profile.referral_hero_section.subtitle')}
          <Tooltip
            disableFocusListener
            arrow
            title={
              <Typography color="inherit">
                {t('profile.referral_hero_section.tooltip_text')}
                <TooltipLink href="https://decentraland.org/referral-terms" target="_blank" rel="noopener noreferrer">
                  {t('profile.referral_hero_section.tooltip_link_label')}
                </TooltipLink>
                .
              </Typography>
            }
            placement="top"
          >
            <InfoOutlinedIcon fontSize="small" />
          </Tooltip>
        </Subtitle>
        <ReferralContainer>
          <Box display="flex" width="100%">
            <Tooltip
              onClose={() => setCopyTooltipOpen(false)}
              open={copyTooltipOpen}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              arrow
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckRoundedIcon /> {t('profile.referral_hero_section.copied_to_clipboard')}
                </Box>
              }
            >
              <ReferralInput
                value={`${window.location.origin}/invite/${inviteDisplay}`}
                onClick={handleCopyLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={t('profile.referral_hero_section.copy_link')} placement="top" arrow>
                        <ContentCopyOutlinedIcon />
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Tooltip>
            <ReferralButton variant="contained" endIcon={<ShareRoundedIcon />} onClick={handleShareButtonClick}>
              {t('profile.referral_hero_section.share')}
            </ReferralButton>
            <Menu anchorEl={anchorMenu} open={shareMenuOpen} onClose={() => setAnchorMenu(null)}>
              <MenuItem onClick={handleCopyLink}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ContentCopyOutlinedIcon /> {t('profile.referral_hero_section.copy_link')}
                </Box>
              </MenuItem>
              <MenuItem onClick={handleShareOnXClick}>
                <Box display="flex" alignItems="center" gap={1}>
                  <XIcon /> {t('profile.referral_hero_section.share_on_x')}
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </ReferralContainer>
        <HowItWorksButton onClick={() => setShowSteps(prev => !prev)}>
          {t('profile.referral_hero_section.how_it_works')} {showSteps ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
        </HowItWorksButton>
        <StepsContainer showSteps={showSteps}>
          <Step>
            <StepTextContainer>
              <StepNumber variant="h5">1</StepNumber>
              <StepText variant="body1">{t('profile.referral_hero_section.step_1')}</StepText>
            </StepTextContainer>
            <StepImage src={ENVELOPE_SRC} alt="Step 1" />
          </Step>
          <Step>
            <StepTextContainer>
              <StepNumber variant="h5">2</StepNumber>
              <StepText variant="body1">{t('profile.referral_hero_section.step_2')}</StepText>
            </StepTextContainer>
            <StepImage src={LOGO_POINTER_SRC} alt="Step 2" />
          </Step>
          <Step>
            <StepTextContainer>
              <StepNumber variant="h5">3</StepNumber>
              <StepText variant="body1">{t('profile.referral_hero_section.step_3')}</StepText>
            </StepTextContainer>
            <StepImage src={MEDAL_SRC} alt="Step 3" />
          </Step>
        </StepsContainer>
      </HeroWrapper>
    </SectionContainer>
  )
})

export { ReferralHeroSection }
export type { ReferralHeroSectionProps }
