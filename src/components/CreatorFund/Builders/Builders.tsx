import { memo, useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { type ConnectCardData, connectCards } from '../../Create/data'
import { CreatorFundSection, DisplayTitle, SectionInner } from '../CreatorFund.styled'
import {
  ArrowButton,
  AuthorAvatar,
  AuthorName,
  AuthorRole,
  BuildersHeader,
  BuildersSubtitle,
  CarouselControls,
  CarouselSlide,
  CarouselTrack,
  CarouselViewport,
  DesktopArrows,
  Dot,
  Dots,
  Quote,
  QuoteAuthor,
  QuoteCard
} from './Builders.styled'

type BuilderSlideProps = {
  builder: ConnectCardData
  perPage: number
  role: string
}

const BuilderSlide = memo(({ builder, perPage, role }: BuilderSlideProps) => (
  <CarouselSlide perPage={perPage}>
    <QuoteCard>
      <Quote>&ldquo;{builder.description}&rdquo;</Quote>
      <QuoteAuthor>
        <AuthorAvatar src={builder.image} alt={builder.name} loading="lazy" />
        <div>
          <AuthorName>{builder.name}</AuthorName>
          <AuthorRole>{role}</AuthorRole>
        </div>
      </QuoteAuthor>
    </QuoteCard>
  </CarouselSlide>
))

BuilderSlide.displayName = 'BuilderSlide'

const Builders = memo(() => {
  const l = useFormatMessage()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const perPage = isMobile ? 1 : 3
  // One "page" per possible first visible card, so the last page is never half empty.
  const pageCount = connectCards.length - perPage + 1
  const [requestedPage, setRequestedPage] = useState(0)
  // Clamp when a resize to a wider layout leaves fewer pages than the current one.
  const page = Math.min(requestedPage, pageCount - 1)

  const go = useCallback((step: number) => setRequestedPage((page + step + pageCount) % pageCount), [page, pageCount])
  const previous = useCallback(() => go(-1), [go])
  const next = useCallback(() => go(1), [go])

  const role = l('page.creator_fund.builders.role')

  return (
    <CreatorFundSection>
      <SectionInner>
        <BuildersHeader>
          <div>
            <DisplayTitle>{l('page.creator_fund.builders.title')}</DisplayTitle>
            <BuildersSubtitle>{l('page.creator_fund.builders.subtitle')}</BuildersSubtitle>
          </div>
          <DesktopArrows>
            <ArrowButton type="button" aria-label={l('page.creator_fund.builders.previous')} onClick={previous}>
              <ChevronLeftIcon />
            </ArrowButton>
            <ArrowButton type="button" aria-label={l('page.creator_fund.builders.next')} onClick={next}>
              <ChevronRightIcon />
            </ArrowButton>
          </DesktopArrows>
        </BuildersHeader>
        <CarouselViewport>
          <CarouselTrack page={page} perPage={perPage}>
            {connectCards.map(builder => (
              <BuilderSlide key={builder.id} builder={builder} perPage={perPage} role={role} />
            ))}
          </CarouselTrack>
        </CarouselViewport>
        <CarouselControls>
          <ArrowButton type="button" compact aria-label={l('page.creator_fund.builders.previous')} onClick={previous}>
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
                onClick={() => setRequestedPage(index)}
              />
            ))}
          </Dots>
          <ArrowButton type="button" compact aria-label={l('page.creator_fund.builders.next')} onClick={next}>
            <ChevronRightIcon />
          </ArrowButton>
        </CarouselControls>
      </SectionInner>
    </CreatorFundSection>
  )
})

Builders.displayName = 'Builders'

export { Builders }
