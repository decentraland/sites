import { memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BlockIcon from '@mui/icons-material/Block'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Button, CircularProgress } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useAddSceneBanMutation, useGetSceneBansQuery, useRemoveSceneBanMutation } from '../../../features/bans'
import type { SceneBan, SceneBanScope } from '../../../features/bans'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { AddRow, EntryAddress, EntryIdentity, EntryInput, EntryList, EntryName, EntryRow } from './entryList.styled'
import { Helper, SpinnerBox } from './world.styled'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

interface BanRowItemProps {
  ban: SceneBan
  onUnban: (ban: SceneBan) => void
  removing: boolean
  unbanLabel: string
}

// Memo'd list row (rule 11).
const BanRowItem = memo(function BanRowItem({ ban, onUnban, removing, unbanLabel }: BanRowItemProps) {
  return (
    <EntryRow>
      <EntryIdentity>
        {ban.name ? <EntryName>{ban.name}</EntryName> : null}
        <EntryAddress>{ban.bannedAddress}</EntryAddress>
      </EntryIdentity>
      <Button variant="outlined" color="error" size="small" disabled={removing} onClick={() => onUnban(ban)}>
        {unbanLabel}
      </Button>
    </EntryRow>
  )
})

// Scene-ban management — a sub-panel of the Moderation tab. ModerationPage owns
// the card chrome + sub-tab nav, so this renders only its hint, add row and list.
function BansPanel() {
  const t = useFormatMessage()
  const { worldName, latest } = useWorldContext()
  const { identity } = useAuthIdentity()
  const [value, setValue] = useState('')

  const scope = useMemo<SceneBanScope | null>(() => {
    if (!latest) return null
    return { identity, sceneId: latest.entityId, realmName: worldName, parcel: latest.baseParcel ?? '0,0' }
  }, [identity, latest, worldName])

  const { data, isLoading, isError } = useGetSceneBansQuery(scope && identity ? { ...scope, limit: 100 } : skipToken)
  const [addSceneBan, addState] = useAddSceneBanMutation()
  const [removeSceneBan, removeState] = useRemoveSceneBanMutation()

  const handleAdd = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || !scope) return
    const target = ADDRESS_RE.test(trimmed) ? { address: trimmed.toLowerCase() } : { name: trimmed }
    try {
      await addSceneBan({ ...scope, ...target }).unwrap()
      setValue('')
    } catch {
      /* surfaced via addState.isError */
    }
  }, [addSceneBan, scope, value])

  const handleUnban = useCallback(
    (ban: SceneBan) => {
      if (!scope) return
      // Name-only bans can come back with an empty address; fall back to the
      // name so the DELETE body never carries an empty `banned_address`.
      const target = ban.bannedAddress ? { address: ban.bannedAddress } : { name: ban.name }
      removeSceneBan({ ...scope, ...target }).catch(() => undefined)
    },
    [removeSceneBan, scope]
  )

  const bans = data?.results ?? []

  return (
    <>
      <Helper>{t('page.creators.world.bans_hint')}</Helper>

      {!identity ? (
        <Helper>{t('page.creators.world.bans_sign_in')}</Helper>
      ) : !latest ? (
        <Helper>{t('page.creators.world.bans_no_deployment')}</Helper>
      ) : (
        <>
          <AddRow>
            <EntryInput
              value={value}
              onChange={event => setValue(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && handleAdd()}
              placeholder={t('page.creators.world.bans_placeholder')}
              aria-label={t('page.creators.world.bans_placeholder')}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<BlockIcon />}
              disabled={!value.trim() || addState.isLoading}
              onClick={handleAdd}
            >
              {t('page.creators.world.bans_add')}
            </Button>
          </AddRow>
          {addState.isError ? <Helper>{t('page.creators.world.bans_error')}</Helper> : null}

          {isLoading ? (
            <SpinnerBox>
              <CircularProgress size={24} />
            </SpinnerBox>
          ) : isError ? (
            <Helper>{t('page.creators.world.bans_load_error')}</Helper>
          ) : bans.length === 0 ? (
            <Helper>{t('page.creators.world.bans_empty')}</Helper>
          ) : (
            <EntryList>
              {bans.map(ban => (
                <BanRowItem
                  key={ban.bannedAddress}
                  ban={ban}
                  onUnban={handleUnban}
                  removing={removeState.isLoading}
                  unbanLabel={t('page.creators.world.bans_unban')}
                />
              ))}
            </EntryList>
          )}
        </>
      )}
    </>
  )
}

export { BansPanel }
