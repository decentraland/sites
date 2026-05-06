import { LoadingScreenProps } from './LoadingScreen.types'
import { LoadingContainer, LoadingSpinner, LoadingText } from './LoadingScreen.styled'

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>{message}</LoadingText>
    </LoadingContainer>
  )
}
