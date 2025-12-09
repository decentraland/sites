import { dclColors, styled } from 'decentraland-ui2'

const TextMarqueeSection = styled('section')(({ theme }) => ({
  width: '100%',
  padding: 0,
  margin: 0,
  position: 'relative',
  height: '83px',
  display: 'flex',
  alignItems: 'center',
  background: `linear-gradient(90deg, ${dclColors.brand.yellow} 0%, ${dclColors.brand.melon} 17.07%, ${dclColors.brand.orange} 33.61%, ${dclColors.brand.ruby} 51%, ${dclColors.brand.lavender} 66.8%, ${dclColors.brand.violet} 83.34%, ${dclColors.brand.purple} 100%)`,
  marginBottom: theme.spacing(18.75),
  [theme.breakpoints.down('xs')]: {
    height: '110px',
    marginBottom: theme.spacing(9.375)
  }
}))

export { TextMarqueeSection }
