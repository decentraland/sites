import { dclColors, styled } from 'decentraland-ui2'

const DecentralandText = styled('span')({
  fontFamily: 'DecentralandHero',
  background: `linear-gradient(261.51deg, ${dclColors.brand.ruby} 6.92%, ${dclColors.brand.yellow} 83.3%)`,
  backgroundClip: 'text',
  webkitBackgroundClip: 'text',
  webkitTextFillColor: 'transparent',
  color: 'transparent',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit'
})

export { DecentralandText }
