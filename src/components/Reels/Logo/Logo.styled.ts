import { styled } from 'decentraland-ui2'

/* eslint-disable @typescript-eslint/naming-convention */
const LogoContainer = styled('a')(({ theme }) => ({
  height: 56,
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  '& .reels-logo-image': {
    width: 30,
    height: 30,
    marginLeft: 25
  },
  '& .reels-logo-text': {
    height: 15.066,
    marginLeft: 8
  },
  [theme.breakpoints.down('md')]: {
    '& .reels-logo-text': { display: 'none' }
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

export { LogoContainer }
