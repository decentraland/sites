/* eslint-disable @typescript-eslint/naming-convention */
import { Link } from 'react-router-dom'
import { Box, dclColors, styled } from 'decentraland-ui2'

const DateText = styled('span')(({ theme }) => ({
  marginRight: '16px',
  color: theme.palette.text.primary,
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  textTransform: 'uppercase',
  display: 'inline'
}))

const CategoryLink = styled(Link)(() => ({
  color: dclColors.neutral.gray3,
  fontSize: '13px',
  textDecoration: 'none',
  textTransform: 'uppercase',
  transition: 'color 250ms ease',
  fontWeight: 400,
  '&:hover': {
    color: dclColors.neutral.gray2
  }
}))

const CardImageLink = styled(Link)(() => ({
  display: 'block',
  '&:hover > img': {
    transform: 'translate(0, -4px)',
    boxShadow: '0 10px 20px 0 rgba(0, 0, 0, 0.12)'
  }
}))

const MetaBox = styled(Box)(() => ({}))

export { CardImageLink, CategoryLink, DateText, MetaBox }
