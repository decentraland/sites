import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
import { useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../../intl/LocaleContext'
import { heroData } from '../../Create/data'
import { Video } from '../../Video'
import { formatDateRange, formatUsd } from '../CreatorFund.helpers'
import { PrimaryButtonLink, RubyTile } from '../CreatorFund.styled'
import { betaProgram } from '../data'
import {
  EyebrowDot,
  FactCard,
  FactLabel,
  FactValue,
  FactsGrid,
  HeroActions,
  HeroContent,
  HeroEyebrow,
  HeroOverlay,
  HeroSection,
  HeroSubtitle,
  HeroTitle,
  HeroTitleHighlight,
  HeroVideo,
  SubtitleLine
} from './Hero.styled'

const Hero = memo(() => {
  const l = useFormatMessage()
  const { locale } = useLocale()
  // Same footage as the /create hero, so the two creator pages read as one.
  const isMobile = useMediaQuery('(max-width: 767px)')
  const video = isMobile ? heroData.videoPortrait : heroData.videoLandscape
  const poster = isMobile ? heroData.imagePortrait : heroData.imageLandscape

  const facts = [
    { value: formatUsd(betaProgram.seasonPoolUsd), label: l('page.creator_fund.hero.fact_pool') },
    { value: formatUsd(betaProgram.cycles[0].allocationUsd), label: l('page.creator_fund.hero.fact_cycle') },
    {
      value: formatDateRange(locale, betaProgram.cycles[0].start, betaProgram.cycles[betaProgram.cycles.length - 1].end),
      label: l('page.creator_fund.hero.fact_season')
    }
  ]

  return (
    <HeroSection id="overview">
      <HeroVideo>
        <Video loop muted autoPlay playsInline width={video.width} height={video.height} poster={poster.url} source={video.url} />
      </HeroVideo>
      <HeroOverlay />
      <HeroContent>
        <HeroEyebrow>
          <EyebrowDot />
          {l('page.creator_fund.hero.eyebrow')}
        </HeroEyebrow>
        <HeroTitle>
          {l('page.creator_fund.hero.title')} <HeroTitleHighlight>{l('page.creator_fund.hero.title_highlight')}</HeroTitleHighlight>
        </HeroTitle>
        <HeroSubtitle>
          <SubtitleLine>{l('page.creator_fund.hero.subtitle')}</SubtitleLine>
          <SubtitleLine>
            <strong>{l('page.creator_fund.hero.pool_amount', { pool: formatUsd(betaProgram.seasonPoolUsd) })}</strong>{' '}
            {l('page.creator_fund.hero.pool_text')}
          </SubtitleLine>
        </HeroSubtitle>
        <HeroActions>
          <PrimaryButtonLink href="#join">{l('page.creator_fund.cta.join')}</PrimaryButtonLink>
        </HeroActions>
        <FactsGrid>
          {facts.map(fact => (
            <FactCard key={fact.label}>
              <RubyTile size="small">
                <CheckIcon />
              </RubyTile>
              <div>
                <FactValue>{fact.value}</FactValue>
                <FactLabel>{fact.label}</FactLabel>
              </div>
            </FactCard>
          ))}
        </FactsGrid>
      </HeroContent>
    </HeroSection>
  )
})

Hero.displayName = 'Hero'

export { Hero }
