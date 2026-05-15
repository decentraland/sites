import { Box, styled } from 'decentraland-ui2'

const ReferralsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative',
  gap: '24px'
})

const ReferralHeroContainer = styled(Box)({
  width: '100%'
})

const ReferralJourneySectionContainer = styled(Box)({
  width: '100%'
})

export { ReferralHeroContainer, ReferralJourneySectionContainer, ReferralsContainer }
