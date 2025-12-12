import { Fragment, memo } from 'react'
import { DecentralandText } from './WrapDecentralandText.styled'

const WrapDecentralandText = memo((props: { text: string }) => {
  const { text } = props

  const parts = text.split(/(Decentraland)/gi)
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === 'decentraland' ? (
          <Fragment key={index}>
            <DecentralandText>{part}</DecentralandText>
            <br />
          </Fragment>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        )
      )}
    </>
  )
})

export { WrapDecentralandText }
