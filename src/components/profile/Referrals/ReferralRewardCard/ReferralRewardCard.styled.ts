import { Rarity } from '@dcl/schemas'
import { Box, Button, Typography, styled } from 'decentraland-ui2'

const ReferralRewardCardContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start'
})

const ReferralRewardCardHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px'
})

const ReferralRewardCardTitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: '160%',
  letterSpacing: '0px',
  textAlign: 'center'
})

const GradientBorder = styled(Box, { shouldForwardProp: prop => prop !== 'completed' })<{ completed: boolean }>(({ completed }) => ({
  borderRadius: '12px',
  padding: '4px',
  background: completed ? 'linear-gradient(243.96deg, #FF2D55 -11.67%, #FFBC5B 88.23%)' : 'transparent',
  display: 'inline-block'
}))

const CardContainer = styled(Box, { shouldForwardProp: prop => prop !== 'completed' && prop !== 'rarity' })<{
  completed: boolean
  rarity: Rarity | 'SWAG'
}>(({ completed, rarity }) => {
  let background: Partial<Record<'backgroundImage' | 'backgroundColor', string>>

  if (completed && rarity === 'SWAG') {
    background = { backgroundImage: 'linear-gradient(116.34deg, #FFBC5B 0%, #FF2D55 50.52%, #C640CD 100%)' }
  } else if (!completed && rarity === 'SWAG') {
    background = {
      backgroundImage: 'linear-gradient(116.34deg, rgba(255, 188, 91, 0.4) 0%, rgba(255, 45, 85, 0.4) 50.52%, rgba(198, 64, 205, 0.4) 100%)'
    }
  } else if (completed) {
    background = { backgroundColor: Rarity.getColor(rarity as Rarity) }
  } else {
    background = { backgroundColor: `${Rarity.getColor(rarity as Rarity)}40` }
  }

  return {
    ...background,
    width: '163px',
    height: '205px',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxShadow: 'none',
    position: 'relative',
    overflow: 'hidden'
  }
})

const HeaderContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'calc(100% - 24px)',
  margin: '16px auto 12px'
})

const CompletedIcon = styled(Box)({
  width: '24px',
  height: '24px',
  background: 'rgba(28, 28, 28, 1)',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const RewardImageContainer = styled(Box)({
  width: '100%',
  height: '127px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const RewardImage = styled('img', { shouldForwardProp: prop => prop !== 'completed' })<{ completed: boolean }>(({ completed }) => ({
  width: '90%',
  objectFit: 'contain',
  marginBottom: '12px',
  opacity: completed ? 1 : 0.4
}))

const RewardRarity = styled(Typography, { shouldForwardProp: prop => prop !== 'rarity' })<{ rarity: Rarity | 'SWAG' }>(({ rarity }) => {
  let color = '#FFF'
  if (rarity === Rarity.EXOTIC) {
    color = 'rgba(36, 33, 41, 1)'
  }

  return {
    color,
    fontWeight: 900,
    fontStyle: 'italic',
    fontSize: '12.8px',
    lineHeight: '14.4px',
    letterSpacing: '0px',
    textTransform: 'uppercase'
  }
})

const ClaimButton = styled(Button)({
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '157%',
  letterSpacing: '0px',
  textAlign: 'center',
  textDecoration: 'underline',
  marginTop: '-16px',
  color: '#fff',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.MuiButton-sizeMedium.MuiButton-textPrimary:not(.Mui-disabled):not(.Mui-focusVisible):hover': {
    color: '#fff',
    backgroundColor: 'transparent'
  }
})

export {
  CardContainer,
  ClaimButton,
  CompletedIcon,
  GradientBorder,
  HeaderContainer,
  ReferralRewardCardContainer,
  ReferralRewardCardHeader,
  ReferralRewardCardTitle,
  RewardImage,
  RewardImageContainer,
  RewardRarity
}
