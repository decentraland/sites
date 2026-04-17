/* eslint-disable @typescript-eslint/naming-convention */
import { Link } from 'react-router-dom'
import { Box, Card, CardContent, Skeleton, styled } from 'decentraland-ui2'
import { CardImageLink, CategoryLink, DateText, MetaBox } from '../shared/PostCard.styled'

const CardContainer = styled(Card)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: 'calc((100% - (32px * 2)) / 3)',
  marginRight: '32px',
  marginBottom: '40px',
  position: 'relative',
  boxShadow: 'none',
  backgroundColor: 'transparent !important',
  background: 'transparent !important',
  '& .MuiPaper-root': {
    backgroundColor: 'transparent !important',
    background: 'transparent !important'
  },
  '@media (max-width: 1096px)': {
    width: 'calc((100% - 24px) / 2)',
    marginRight: 0
  },
  '@media (max-width: 568px)': {
    width: '100%'
  },
  '&:nth-of-type(3n)': {
    marginRight: 0
  }
}))

const CardImage = styled('img')(() => ({
  objectFit: 'cover',
  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16)',
  borderRadius: '5px',
  width: '100%',
  aspectRatio: '2 / 1',
  marginBottom: '12px',
  transition: 'transform 250ms ease, box-shadow 250ms ease'
}))

const CardInfo = styled(CardContent)({
  width: '100%',
  padding: 0,
  backgroundColor: 'transparent !important',
  background: 'transparent !important',
  '&.MuiCardContent-root': {
    backgroundColor: 'transparent !important',
    background: 'transparent !important'
  },
  '&:last-child': {
    paddingBottom: 0
  }
})

const TitleLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  paddingTop: '8px',
  display: 'block',
  color: theme.palette.text.primary,
  '& h2, & h6': {
    fontSize: '20px',
    lineHeight: '28px',
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  '&:visited, &:link, &:active': {
    color: theme.palette.text.primary
  },
  '& *': {
    color: theme.palette.text.primary
  }
}))

const LoadingHeader = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between'
}))

const LoadingImage = styled(Skeleton)(() => ({
  height: '200px'
}))

const LoadingMetaSkeleton = styled(Skeleton)(() => ({
  width: '100px'
}))

const LoadingTextSkeleton = styled(Skeleton)(() => ({
  width: '100%'
}))

const LoadingTextSkeletonShort = styled(Skeleton)(() => ({
  width: '80%'
}))

export {
  CardContainer,
  CardImage,
  CardImageLink,
  CardInfo,
  CategoryLink,
  DateText,
  LoadingHeader,
  LoadingImage,
  LoadingMetaSkeleton,
  LoadingTextSkeleton,
  LoadingTextSkeletonShort,
  MetaBox,
  TitleLink
}
