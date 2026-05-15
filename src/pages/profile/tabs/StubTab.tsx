import { Typography } from 'decentraland-ui2'
import { StubRoot, StubTitle } from './StubTab.styled'

interface StubTabProps {
  title: string
  description?: string
}

function StubTab({ title, description }: StubTabProps) {
  return (
    <StubRoot>
      <StubTitle variant="h6">{title}</StubTitle>
      {description ? <Typography variant="body2">{description}</Typography> : null}
    </StubRoot>
  )
}

export { StubTab }
export type { StubTabProps }
