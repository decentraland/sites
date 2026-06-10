import { useCallback, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Tab, Tabs } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { ServerLogs } from '../../../components/creators/ServerLogs'
import { EnvManager, PlayersManager, SceneManager } from '../../../components/storage/managers'
import type { ServerLogsScope } from '../../../features/authServer'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { Helper, SectionCard, SectionHeaderRow, SectionTitle } from './world.styled'

type AuthServerTab = 'logs' | 'storage'
type StorageKind = 'env' | 'scene' | 'players'

// The "Auth Server" tab surfaces everything tied to a scene's authoritative
// multiplayer server: a live log stream and its scene/env/player storage. The
// whole tab is gated on `authoritativeMultiplayer` (scene.json) — without it
// there is no authoritative server to manage.
function AuthServerPage() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { worldName, latest } = useWorldContext()
  const { identity } = useAuthIdentity()
  const [tab, setTab] = useState<AuthServerTab>('logs')
  const [kind, setKind] = useState<StorageKind>('scene')

  const serverEnabled = latest?.authoritativeMultiplayer === true

  // Signing scope for the `/logs` SSE stream (null until signed in / deployed).
  const logsScope = useMemo<ServerLogsScope | null>(() => {
    if (!identity || !latest) return null
    return { identity, sceneId: `${worldName}`, realmName: `${worldName}`, parcel: latest.baseParcel ?? '0,0' }
  }, [identity, latest, worldName])

  const handleSelectPlayer = useCallback(
    (address: string) => navigate(`/storage/players/${address}?realm=${encodeURIComponent(worldName)}`),
    [navigate, worldName]
  )
  const handleTabChange = useCallback((_event: SyntheticEvent, value: AuthServerTab) => setTab(value), [])
  const handleStorageTabChange = useCallback((_event: SyntheticEvent, value: StorageKind) => setKind(value), [])

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.auth_server')} · ${worldName}`,
    properties: { section: 'creators_world_auth_server', world: worldName }
  })

  const documentTitle = `${t('page.creators.world.nav.auth_server')} · ${worldName}`

  if (!serverEnabled) {
    return (
      <SectionCard>
        <Helmet>
          <title>{documentTitle}</title>
        </Helmet>
        <SectionHeaderRow>
          <SectionTitle>{t('page.creators.world.nav.auth_server')}</SectionTitle>
        </SectionHeaderRow>
        <Helper>{t('page.creators.world.storage_not_authoritative')}</Helper>
      </SectionCard>
    )
  }

  return (
    <SectionCard>
      <Helmet>
        <title>{documentTitle}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.auth_server')}</SectionTitle>
      </SectionHeaderRow>

      <Tabs value={tab} onChange={handleTabChange} aria-label={t('page.creators.world.nav.auth_server')}>
        <Tab value="logs" label={t('page.creators.world.auth_server_tab_logs')} />
        <Tab value="storage" label={t('page.creators.world.auth_server_storage_title')} />
      </Tabs>

      {/* Only the active tab's content mounts — switching away unmounts the logs
          panel, which aborts the SSE stream (avoids unnecessary connections). */}
      {tab === 'logs' ? (
        <ServerLogs scope={logsScope} />
      ) : (
        <>
          <Helper>{t(identity ? 'page.creators.world.storage_hint' : 'page.creators.world.storage_sign_in')}</Helper>
          <Tabs value={kind} onChange={handleStorageTabChange} aria-label={t('page.creators.world.auth_server_storage_title')}>
            <Tab value="scene" label={t('page.creators.world.storage.scene')} />
            <Tab value="env" label={t('page.creators.world.storage.env')} />
            <Tab value="players" label={t('page.creators.world.storage.players')} />
          </Tabs>

          {kind === 'scene' ? <SceneManager identity={identity} realm={worldName} position={null} /> : null}
          {kind === 'env' ? <EnvManager identity={identity} realm={worldName} position={null} /> : null}
          {kind === 'players' ? (
            <PlayersManager identity={identity} realm={worldName} position={null} onSelectPlayer={handleSelectPlayer} />
          ) : null}
        </>
      )}
    </SectionCard>
  )
}

export { AuthServerPage }
