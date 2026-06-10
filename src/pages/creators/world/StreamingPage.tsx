import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Button, CircularProgress } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import {
  useCreateSceneStreamMutation,
  useGetSceneStreamQuery,
  useResetSceneStreamMutation,
  useRevokeSceneStreamMutation
} from '../../../features/sceneGatekeeper'
import type { SceneScope } from '../../../features/sceneGatekeeper'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { ActionsRow, CopyButton, Expiry, Field, FieldLabel, Fields, ValueBox, ValueRow } from './StreamingPage.styled'
import { GhostButton, Helper, PrimaryButton, SectionCard, SectionHeaderRow, SectionTitle, SpinnerBox } from './world.styled'

function StreamingPage() {
  const t = useFormatMessage()
  const { worldName, latest } = useWorldContext()
  const { identity } = useAuthIdentity()
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)

  const scope = useMemo<SceneScope | null>(() => {
    if (!latest) return null
    return { identity, sceneId: latest.entityId, realmName: worldName, parcel: latest.baseParcel ?? '0,0' }
  }, [identity, latest, worldName])

  const { data: access, isLoading, isError } = useGetSceneStreamQuery(scope && identity ? scope : skipToken)
  const [createStream, createState] = useCreateSceneStreamMutation()
  const [resetStream, resetState] = useResetSceneStreamMutation()
  const [revokeStream, revokeState] = useRevokeSceneStreamMutation()

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.streaming')} · ${worldName}`,
    properties: { section: 'creators_world_streaming', world: worldName }
  })

  const busy = createState.isLoading || resetState.isLoading || revokeState.isLoading

  const copy = useCallback((text: string, field: 'url' | 'key') => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(field)
        window.setTimeout(() => setCopied(current => (current === field ? null : current)), 1500)
      },
      () => undefined
    )
  }, [])

  const endsLabel = access?.ends_at ? new Date(access.ends_at).toLocaleString() : null

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.streaming')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.streaming')}</SectionTitle>
      </SectionHeaderRow>
      <Helper>{t('page.creators.world.streaming_hint')}</Helper>

      {!identity ? (
        <Helper>{t('page.creators.world.streaming_sign_in')}</Helper>
      ) : !latest ? (
        <Helper>{t('page.creators.world.streaming_no_deployment')}</Helper>
      ) : isLoading ? (
        <SpinnerBox>
          <CircularProgress size={24} />
        </SpinnerBox>
      ) : isError ? (
        <Helper>{t('page.creators.world.streaming_load_error')}</Helper>
      ) : !access ? (
        <>
          <Helper>{t('page.creators.world.streaming_none')}</Helper>
          <PrimaryButton disableRipple disabled={busy} onClick={() => scope && createStream(scope)}>
            {t('page.creators.world.streaming_generate')}
          </PrimaryButton>
        </>
      ) : (
        <>
          <Fields>
            <Field>
              <FieldLabel>{t('page.creators.world.streaming_server')}</FieldLabel>
              <ValueRow>
                <ValueBox>{access.streaming_url}</ValueBox>
                <CopyButton type="button" onClick={() => copy(access.streaming_url, 'url')}>
                  {copied === 'url' ? <CheckIcon /> : <ContentCopyIcon />}
                  {copied === 'url' ? t('page.creators.world.streaming_copied') : t('page.creators.world.streaming_copy')}
                </CopyButton>
              </ValueRow>
            </Field>
            <Field>
              <FieldLabel>{t('page.creators.world.streaming_key')}</FieldLabel>
              <ValueRow>
                <ValueBox>{access.streaming_key}</ValueBox>
                <CopyButton type="button" onClick={() => copy(access.streaming_key, 'key')}>
                  {copied === 'key' ? <CheckIcon /> : <ContentCopyIcon />}
                  {copied === 'key' ? t('page.creators.world.streaming_copied') : t('page.creators.world.streaming_copy')}
                </CopyButton>
              </ValueRow>
            </Field>
          </Fields>
          {endsLabel ? (
            <Expiry>
              {t('page.creators.world.streaming_expires')}: <strong>{endsLabel}</strong>
            </Expiry>
          ) : null}
          <ActionsRow>
            <GhostButton disableRipple disabled={busy} onClick={() => scope && resetStream(scope)}>
              {t('page.creators.world.streaming_reset')}
            </GhostButton>
            <Button variant="outlined" color="error" disabled={busy} onClick={() => scope && revokeStream(scope)}>
              {t('page.creators.world.streaming_revoke')}
            </Button>
          </ActionsRow>
        </>
      )}
    </SectionCard>
  )
}

export { StreamingPage }
