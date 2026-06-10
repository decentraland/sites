import { memo, useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LoginIcon from '@mui/icons-material/Login'
// eslint-disable-next-line @typescript-eslint/naming-convention
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PodcastsIcon from '@mui/icons-material/Podcasts'
import { skipToken } from '@reduxjs/toolkit/query/react'
import type { AuthIdentity } from '@dcl/crypto'
import { Button, CircularProgress } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useGetProfileNames } from '../../../features/profile/profile.client'
import {
  useAddWorldPermissionMutation,
  useGetWorldPermissionsQuery,
  useRemoveWorldPermissionMutation
} from '../../../features/worldPermissions'
import type { PermissionEntry, PermissionName } from '../../../features/worldPermissions/worldPermissions.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import { LearnMoreLink, PermBlock, PermHeading, PermName, PermType, RemoveButton } from './AccessPage.styled'
import { AddRow, EntryAddress, EntryIdentity, EntryInput, EntryList, EntryName, EntryRow } from './entryList.styled'
import { Helper, SectionCard, SectionHeaderRow, SectionTitle, SpinnerBox } from './world.styled'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const PERMISSIONS: PermissionName[] = ['deployment', 'streaming', 'access']
const PERMISSION_ICON: Record<PermissionName, React.ReactNode> = {
  deployment: <CloudUploadOutlinedIcon />,
  streaming: <PodcastsIcon />,
  access: <LoginIcon />
}
const PRIVATE_WORLDS_DOCS = 'https://docs.decentraland.org/creator/worlds/about/#access-permissions'

interface WalletRowProps {
  address: string
  name?: string
  onRemove: (address: string) => void
  removeLabel: string
  disabled: boolean
}

const WalletRow = memo(function WalletRow({ address, name, onRemove, removeLabel, disabled }: WalletRowProps) {
  return (
    <EntryRow>
      <EntryIdentity>
        {name ? (
          <>
            <EntryName>{name}</EntryName>
            <EntryAddress>{address}</EntryAddress>
          </>
        ) : (
          <EntryAddress>{address}</EntryAddress>
        )}
      </EntryIdentity>
      <RemoveButton type="button" aria-label={removeLabel} title={removeLabel} disabled={disabled} onClick={() => onRemove(address)}>
        <DeleteOutlineIcon />
      </RemoveButton>
    </EntryRow>
  )
})

interface PermissionSectionProps {
  permission: PermissionName
  entry: PermissionEntry
  identity?: AuthIdentity
  busy: boolean
  names: Map<string, string | undefined>
  onAdd: (permission: PermissionName, address: string) => void
  onRemove: (permission: PermissionName, address: string) => void
}

function PermissionSection(props: PermissionSectionProps) {
  const { permission, entry, identity, busy, names, onAdd, onRemove } = props
  const t = useFormatMessage()
  const [value, setValue] = useState('')
  // `access` can be unrestricted / nft / shared-secret — only allow-lists carry
  // a managed wallet array.
  const wallets = entry.wallets
  const manageable = Array.isArray(wallets)

  const handleAdd = useCallback(() => {
    const trimmed = value.trim().toLowerCase()
    if (!ADDRESS_RE.test(trimmed)) return
    onAdd(permission, trimmed)
    setValue('')
  }, [onAdd, permission, value])

  return (
    <PermBlock>
      <PermHeading>
        <PermName>
          {PERMISSION_ICON[permission]}
          {t(`page.creators.world.access.${permission}`)}
        </PermName>
        <PermType>{entry.type}</PermType>
      </PermHeading>
      <Helper>{t(`page.creators.world.access.${permission}_hint`)}</Helper>

      {!manageable ? (
        <>
          <Helper>{t('page.creators.world.access_unrestricted')}</Helper>
          <LearnMoreLink href={PRIVATE_WORLDS_DOCS} target="_blank" rel="noopener noreferrer">
            {t('page.creators.world.access_learn_more')}
            <OpenInNewIcon />
          </LearnMoreLink>
        </>
      ) : (
        <>
          {wallets.length === 0 ? (
            <Helper>{t('page.creators.world.access_empty')}</Helper>
          ) : (
            <EntryList>
              {wallets.map(address => (
                <WalletRow
                  key={address}
                  address={address}
                  name={names.get(address.toLowerCase())}
                  onRemove={addr => onRemove(permission, addr)}
                  removeLabel={t('page.creators.world.access_remove')}
                  disabled={busy || !identity}
                />
              ))}
            </EntryList>
          )}
          {identity ? (
            <AddRow>
              <EntryInput
                value={value}
                onChange={event => setValue(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleAdd()}
                placeholder={t('page.creators.world.access_placeholder')}
                aria-label={t('page.creators.world.access_placeholder')}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                disabled={busy || !ADDRESS_RE.test(value.trim())}
                onClick={handleAdd}
              >
                {t('page.creators.world.access_add')}
              </Button>
            </AddRow>
          ) : null}
        </>
      )}
    </PermBlock>
  )
}

function AccessPage() {
  const t = useFormatMessage()
  const { worldName } = useWorldContext()
  const { identity } = useAuthIdentity()

  const { data, isLoading, isError } = useGetWorldPermissionsQuery(worldName ? { worldName } : skipToken)
  const [addPermission, addState] = useAddWorldPermissionMutation()
  const [removePermission, removeState] = useRemoveWorldPermissionMutation()
  const busy = addState.isLoading || removeState.isLoading

  // Resolve every wallet across the three lists to a profile/DCL name in one
  // batch (rule 12) so rows show names, not just hex addresses.
  const allAddresses = useMemo(() => {
    if (!data) return []
    const set = new Set<string>()
    for (const permission of PERMISSIONS) data.permissions[permission].wallets?.forEach(address => set.add(address))
    return Array.from(set)
  }, [data])
  const names = useGetProfileNames(allAddresses)

  useBlogPageTracking({
    name: `${t('page.creators.world.nav.access')} · ${worldName}`,
    properties: { section: 'creators_world_access', world: worldName }
  })

  const handleAdd = useCallback(
    (permission: PermissionName, address: string) => {
      addPermission({ identity, worldName, permission, address }).catch(() => undefined)
    },
    [addPermission, identity, worldName]
  )
  const handleRemove = useCallback(
    (permission: PermissionName, address: string) => {
      removePermission({ identity, worldName, permission, address }).catch(() => undefined)
    },
    [removePermission, identity, worldName]
  )

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.access')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.access')}</SectionTitle>
      </SectionHeaderRow>
      <Helper>{t(identity ? 'page.creators.world.access_hint' : 'page.creators.world.access_sign_in')}</Helper>
      {addState.isError || removeState.isError ? <Helper>{t('page.creators.world.access_error')}</Helper> : null}

      {isLoading ? (
        <SpinnerBox>
          <CircularProgress size={24} />
        </SpinnerBox>
      ) : isError || !data ? (
        <Helper>{t('page.creators.world.access_load_error')}</Helper>
      ) : (
        PERMISSIONS.map(permission => (
          <PermissionSection
            key={permission}
            permission={permission}
            entry={data.permissions[permission]}
            identity={identity}
            busy={busy}
            names={names}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))
      )}
    </SectionCard>
  )
}

export { AccessPage }
