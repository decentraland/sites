import { Link } from 'react-router-dom'
import { sanitizeHighlight } from '../Search/sanitizeHighlight'
import type { SearchResultCardProps } from './SearchResultCard.types'
import {
  CardContainer,
  CardContentBox,
  CardDescription,
  CardImage,
  CardTextBox,
  CardTitle,
  LoadingDescription,
  LoadingDescriptionShort,
  LoadingImage,
  LoadingTitle
} from './SearchResultCard.styled'

const SearchResultCard = (props: SearchResultCardProps) => {
  const { result, loading } = props

  if (loading) {
    return (
      <CardContainer>
        <CardContentBox>
          <LoadingImage variant="rectangular" />
          <CardTextBox>
            <LoadingTitle variant="text" />
            <LoadingDescription variant="text" />
            <LoadingDescriptionShort variant="text" />
          </CardTextBox>
        </CardContentBox>
      </CardContainer>
    )
  }

  if (!result) {
    return null
  }

  return (
    <CardContainer>
      <Link to={result.url}>
        <CardContentBox>
          {result.image && <CardImage src={result.image} alt="" loading="lazy" decoding="async" />}
          <CardTextBox>
            {typeof result.title === 'string' ? (
              // eslint-disable-next-line @typescript-eslint/naming-convention
              <CardTitle dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.title) }} />
            ) : (
              <CardTitle>{result.title}</CardTitle>
            )}
            {typeof result.description === 'string' ? (
              // eslint-disable-next-line @typescript-eslint/naming-convention
              <CardDescription dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.description) }} />
            ) : (
              <CardDescription>{result.description}</CardDescription>
            )}
          </CardTextBox>
        </CardContentBox>
      </Link>
    </CardContainer>
  )
}

export { SearchResultCard }
