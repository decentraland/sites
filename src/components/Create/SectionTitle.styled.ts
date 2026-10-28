import { Typography, dclColors, styled } from 'decentraland-ui2'

// One title recipe for every /create section, matching the landing page's
// section titles (48px/600 desktop, 32px mobile — see src/components/Home/*).
// Sections override only their margins via styled(CreateSectionTitle).
const CreateSectionTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: 48,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  maxWidth: '80vw',
  marginLeft: 'auto',
  marginRight: 'auto',
  ['& span']: {
    background: 'linear-gradient(244deg, #ff2d55 -11.67%, #ffbc5b 88.23%)',
    backgroundClip: 'text',
    ['WebkitBackgroundClip' as string]: 'text',
    ['WebkitTextFillColor' as string]: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

export { CreateSectionTitle }
