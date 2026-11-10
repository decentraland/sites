import { type MouseEvent, memo, useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { CreatorFundSection, DisplayTitle, SectionInner } from '../CreatorFund.styled'
import type { BuilderQuote } from '../CreatorFund.types'
import { CLICK_SECTIONS, builderQuotes } from '../data'
import {
  ArrowButton,
  AuthorAvatar,
  AuthorInitial,
  AuthorName,
  BuildersSubtitle,
  CarouselControls,
  CarouselSlide,
  CarouselTrack,
  CarouselViewport,
  Dot,
  Dots,
  Quote,
  QuoteAuthor,
  QuoteCard,
  QuoteMark
} from './Builders.styled'

type BuilderSlideProps = {
  builder: BuilderQuote
  perPage: number
}

const BuilderSlide = memo(({ builder, perPage }: BuilderSlideProps) => (
  <CarouselSlide perPage={perPage}>
    <QuoteCard>
      <QuoteMark aria-hidden="true" />
      <Quote>&ldquo;{builder.quote}&rdquo;</Quote>
      <QuoteAuthor>
        {builder.image ? (
          <AuthorAvatar src={builder.image} alt={builder.name} loading="lazy" />
        ) : (
          <AuthorInitial aria-hidden="true">{builder.name[0]}</AuthorInitial>
        )}
        <AuthorName>{builder.name}</AuthorName>
      </QuoteAuthor>
    </QuoteCard>
  </CarouselSlide>
))

BuilderSlide.displayName = 'BuilderSlide'

// "Meet Decentraland Builders": creator quotes right above the FAQ. Same-size cards in one row on desktop
// (up to three); one card per page on mobile, with arrows and page dots.
const Builders = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const perPage = Math.min(isMobile ? 1 : 3, builderQuotes.length)
  // One "page" per possible first visible card, so the last page is never half empty.
  const pageCount = Math.max(builderQuotes.length - perPage + 1, 1)
  const [requestedPage, setRequestedPage] = useState(0)
  // Clamp when a resize to a wider layout leaves fewer pages than the current one.
  const page = Math.min(requestedPage, pageCount - 1)

  const previous = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      trackClick(event)
      setRequestedPage((page - 1 + pageCount) % pageCount)
    },
    [page, pageCount, trackClick]
  )
  const next = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      trackClick(event)
      setRequestedPage((page + 1) % pageCount)
    },
    [page, pageCount, trackClick]
  )
  const goTo = useCallback(
    (event: MouseEvent<HTMLButtonElement>, index: number) => {
      trackClick(event)
      setRequestedPage(index)
    },
    [trackClick]
  )

  return (
    <CreatorFundSection>
      <SectionInner>
        <DisplayTitle>{l('page.creator_fund.builders.title')}</DisplayTitle>
        <BuildersSubtitle>{l('page.creator_fund.builders.subtitle')}</BuildersSubtitle>
        <CarouselViewport>
          <CarouselTrack page={page} perPage={perPage}>
            {builderQuotes.map(builder => (
              <BuilderSlide key={builder.name} builder={builder} perPage={perPage} />
            ))}
          </CarouselTrack>
        </CarouselViewport>
        {pageCount > 1 && (
          <CarouselControls>
            <ArrowButton
              type="button"
              aria-label={l('page.creator_fund.builders.previous')}
              {...clickTrackingAttributes(CLICK_SECTIONS.builders, 'Previous')}
              onClick={previous}
            >
              <ChevronLeftIcon />
            </ArrowButton>
            <Dots>
              {Array.from({ length: pageCount }, (_, index) => (
                <Dot
                  key={index}
                  type="button"
                  active={index === page}
                  aria-label={l('page.creator_fund.builders.go_to_slide', { number: index + 1 })}
                  aria-current={index === page}
                  {...clickTrackingAttributes(CLICK_SECTIONS.builders, `Slide ${index + 1}`)}
                  onClick={event => goTo(event, index)}
                />
              ))}
            </Dots>
            <ArrowButton
              type="button"
              aria-label={l('page.creator_fund.builders.next')}
              {...clickTrackingAttributes(CLICK_SECTIONS.builders, 'Next')}
              onClick={next}
            >
              <ChevronRightIcon />
            </ArrowButton>
          </CarouselControls>
        )}
      </SectionInner>
    </CreatorFundSection>
  )
})

Builders.displayName = 'Builders'

export { Builders }
