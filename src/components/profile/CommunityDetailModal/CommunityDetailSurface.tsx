// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useGetCommunityByIdQuery } from '../../../features/communities/communities.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { CommunityDetail } from '../../social/CommunityDetail'
import type { CommunityDetailSurfaceProps } from './CommunityDetailModal.types'
import {
  CommunityCloseButton,
  CommunityHeaderIconButton,
  CommunityHeaderRow,
  CommunityStateBox,
  CommunitySurfaceRoot
} from './CommunityDetailModal.styled'

function CommunityDetailSurface({ communityId, onClose, onBack }: CommunityDetailSurfaceProps) {
  const t = useFormatMessage()
  const { hasValidIdentity, address } = useAuthIdentity()
  const { data, isLoading, isError } = useGetCommunityByIdQuery({ id: communityId, isSigned: hasValidIdentity }, { skip: !communityId })
  const community = data?.data

  return (
    <CommunitySurfaceRoot>
      <CommunityHeaderRow>
        {onBack ? (
          <CommunityHeaderIconButton aria-label={t('profile.header.back')} onClick={onBack}>
            <ArrowBackIosNewIcon fontSize="small" />
          </CommunityHeaderIconButton>
        ) : null}
        <CommunityCloseButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
          <CloseIcon />
        </CommunityCloseButton>
      </CommunityHeaderRow>
      {isLoading ? (
        <CommunityStateBox>
          <CircularProgress size={28} />
        </CommunityStateBox>
      ) : isError || !community ? (
        <CommunityStateBox>
          <Typography variant="body1">{t('community.detail.not_found')}</Typography>
        </CommunityStateBox>
      ) : (
        <CommunityDetail community={community} isLoggedIn={hasValidIdentity} address={address} />
      )}
    </CommunitySurfaceRoot>
  )
}

export { CommunityDetailSurface }
