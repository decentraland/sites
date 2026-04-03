import { type SVGAttributes, memo } from 'react'
import { styled } from 'decentraland-ui2'

type ChevronProps = SVGAttributes<SVGElement> & {
  dark?: boolean
}

const StyledSvg = styled('svg', {
  shouldForwardProp: prop => prop !== 'dark'
})<{ dark?: boolean }>(({ dark }) => ({
  fill: dark ? '#a09ba8' : '#fff',
  cursor: 'pointer'
}))

const Chevron = memo((props: ChevronProps) => {
  const { dark, ...rest } = props
  return (
    <StyledSvg {...rest} dark={dark} xmlns="http://www.w3.org/2000/svg" width="21" height="14" viewBox="0 0 21 14" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.585815 3.41424L3.41424 0.585815L10.5 7.6716L17.5858 0.585815L20.4142 3.41424L10.5 13.3285L0.585815 3.41424Z"
      />
    </StyledSvg>
  )
})

export { Chevron }
