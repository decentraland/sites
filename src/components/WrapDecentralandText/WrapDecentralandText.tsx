import * as React from 'react'
import { DecentralandText } from './WrapDecentralandText.styled'

const WrapDecentralandText = React.memo((props: { text: string }) => {
  const { text } = props

  const parts = text.split(/(Decentraland)/gi)
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === 'decentraland' ? (
          <React.Fragment key={index}>
            <DecentralandText>{part}</DecentralandText>
            <br />
          </React.Fragment>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  )
})

export { WrapDecentralandText }
