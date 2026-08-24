import { memo, useEffect, useState } from 'react'
import { getEnv } from '../../../config/env'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SubnavRoot, SubnavTab, SubnavTabs } from './Subnav.styled'

// Collections is the wemotes-builder SPA mounted on the same domain;
// Scenes and Land live in the legacy builder app. All plain anchors — each
// destination is a different app, so these are real page loads.
const CreatorsSubnav = memo(() => {
  const l = useFormatMessage()
  const builderUrl = getEnv('BUILDER_URL')
  const wemotesBuilderUrl = getEnv('WEMOTES_BUILDER_URL')
  // The translucent band washes out over light content, so it deepens once the page scrolls
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <SubnavRoot className={scrolled ? 'scrolled' : undefined} data-testid="creators-subnav">
      <SubnavTabs aria-label={l('component.creators_landing.subnav.label')}>
        <SubnavTab href="/create" aria-current="page">
          {l('component.creators_landing.subnav.overview')}
        </SubnavTab>
        <SubnavTab href={`${wemotesBuilderUrl}/collections`}>{l('component.creators_landing.subnav.collections')}</SubnavTab>
        <SubnavTab href={`${builderUrl}/scenes`}>{l('component.creators_landing.subnav.scenes')}</SubnavTab>
        <SubnavTab href={`${builderUrl}/land`}>{l('component.creators_landing.subnav.land')}</SubnavTab>
      </SubnavTabs>
    </SubnavRoot>
  )
})

export { CreatorsSubnav }
