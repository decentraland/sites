import { memo, useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Button, CircularProgress } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useAddSceneAdminMutation, useGetSceneAdminsQuery, useRemoveSceneAdminMutation } from '../../../features/sceneGatekeeper'
import type { SceneAdmin, SceneScope } from '../../../features/sceneGatekeeper'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { AddRow, EntryAddress, EntryIdentity, EntryInput, EntryList, EntryName, EntryRow, EntryTag } from './entryList.styled'
import { Helper, SectionCard, SectionHeaderRow, SectionTitle, SpinnerBox } from './world.styled'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

interface AdminRowItemProps {
  admin: SceneAdmin
  onRemove: (address: string) => void
  removing: boolean
  removeLabel: string
  implicitLabel: string
}

// Memo'd list row (rule 11).
const AdminRowItem = memo(function AdminRowItem({ admin, onRemove, removing, removeLabel, implicitLabel }: AdminRowItemProps) {
  return (
    <EntryRow>
      <EntryIdentity>
        {admin.name ? <EntryName>{admin.name}</EntryName> : null}
        <EntryAddress>{admin.admin}</EntryAddress>
      </EntryIdentity>
      {admin.canBeRemoved ? (
        <Button variant="outlined" color="error" size="small" disabled={removing} onClick={() => onRemove(admin.admin)}>
          {removeLabel}
        </Button>
      ) : (
        <EntryTag>{implicitLabel}</EntryTag>
      )}
    </EntryRow>
  )
})

function AdminsPage() {
  const t = useFormatMessage()
  const { worldName, latest } = useWorldContext()
  const { identity } = useAuthIdentity()
  const [value, setValue] = useState('')

  const scope = useMemo<SceneScope | null>(() => {
    if (!latest) return null
    return { identity, sceneId: latest.entityId, realmName: worldName, parcel: latest.baseParcel ?? '0,0' }
  }, [identity, latest, worldName])

  const { data: admins, isLoading, isError } = useGetSceneAdminsQuery(scope && identity ? scope : skipToken)
  const [addSceneAdmin, addState] = useAddSceneAdminMutation()
  const [removeSceneAdmin, removeState] = useRemoveSceneAdminMutation()

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.admins')} · ${worldName}`,
    properties: { section: 'creators_world_admins', world: worldName }
  })

  const handleAdd = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || !scope) return
    const target = ADDRESS_RE.test(trimmed) ? { admin: trimmed.toLowerCase() } : { name: trimmed }
    try {
      await addSceneAdmin({ ...scope, ...target }).unwrap()
      setValue('')
    } catch {
      /* surfaced via addState.isError */
    }
  }, [addSceneAdmin, scope, value])

  const handleRemove = useCallback(
    (address: string) => {
      if (!scope) return
      removeSceneAdmin({ ...scope, admin: address }).catch(() => undefined)
    },
    [removeSceneAdmin, scope]
  )

  const list = admins ?? []

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.admins')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.admins')}</SectionTitle>
      </SectionHeaderRow>
      <Helper>{t('page.creators.world.admins_hint')}</Helper>

      {!identity ? (
        <Helper>{t('page.creators.world.admins_sign_in')}</Helper>
      ) : !latest ? (
        <Helper>{t('page.creators.world.admins_no_deployment')}</Helper>
      ) : (
        <>
          <AddRow>
            <EntryInput
              value={value}
              onChange={event => setValue(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && handleAdd()}
              placeholder={t('page.creators.world.admins_placeholder')}
              aria-label={t('page.creators.world.admins_placeholder')}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              disabled={!value.trim() || addState.isLoading}
              onClick={handleAdd}
            >
              {t('page.creators.world.admins_add')}
            </Button>
          </AddRow>
          {addState.isError ? <Helper>{t('page.creators.world.admins_error')}</Helper> : null}

          {isLoading ? (
            <SpinnerBox>
              <CircularProgress size={24} />
            </SpinnerBox>
          ) : isError ? (
            <Helper>{t('page.creators.world.admins_load_error')}</Helper>
          ) : list.length === 0 ? (
            <Helper>{t('page.creators.world.admins_empty')}</Helper>
          ) : (
            <EntryList>
              {list.map(admin => (
                <AdminRowItem
                  key={admin.admin}
                  admin={admin}
                  onRemove={handleRemove}
                  removing={removeState.isLoading}
                  removeLabel={t('page.creators.world.admins_remove')}
                  implicitLabel={t('page.creators.world.admins_implicit')}
                />
              ))}
            </EntryList>
          )}
        </>
      )}
    </SectionCard>
  )
}

export { AdminsPage }
