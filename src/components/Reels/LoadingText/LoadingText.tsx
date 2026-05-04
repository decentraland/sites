import { Fragment, memo } from 'react'
import { LoadingBox } from './LoadingText.styled'
import type { LoadingSize, LoadingType } from './LoadingText.styled'

interface LoadingTextProps {
  type: LoadingType
  size: LoadingSize
  lines?: number
}

const LoadingText = memo(({ type, size, lines = 1 }: LoadingTextProps) => (
  <Fragment>
    {Array.from({ length: lines }).map((_, index) => (
      <LoadingBox key={index} type={type} size={size} aria-hidden="true" data-testid="reels-loading-text" />
    ))}
  </Fragment>
))

export { LoadingText }
