import { useCallback, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tab, Tabs } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { BansPanel } from './BansPanel'
import { SceneAdminsPanel } from './SceneAdminsPanel'
import { SectionCard, SectionHeaderRow, SectionTitle } from './world.styled'

type ModerationTab = 'admins' | 'bans'

// Groups the scene-access moderation tools (who can moderate, who is banned)
// under one rail entry, mirroring the Auth Server tab's sub-tab pattern.
function ModerationPage() {
  const t = useFormatMessage()
  const { worldName } = useWorldContext()
  const [tab, setTab] = useState<ModerationTab>('admins')

  const handleTabChange = useCallback((_event: SyntheticEvent, value: ModerationTab) => setTab(value), [])

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.moderation')} · ${worldName}`,
    properties: { section: 'creators_world_moderation', world: worldName }
  })

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.moderation')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.moderation')}</SectionTitle>
      </SectionHeaderRow>

      <Tabs value={tab} onChange={handleTabChange} aria-label={t('page.creators.world.nav.moderation')}>
        <Tab value="admins" label={t('page.creators.world.nav.admins')} />
        <Tab value="bans" label={t('page.creators.world.nav.bans')} />
      </Tabs>

      {tab === 'admins' ? <SceneAdminsPanel /> : <BansPanel />}
    </SectionCard>
  )
}

export { ModerationPage }
