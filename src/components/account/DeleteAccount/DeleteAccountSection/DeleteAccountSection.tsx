// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { DeleteAccountSectionProps } from './DeleteAccountSection.types'
import {
  AssetWarningBox,
  AssetWarningDescription,
  AssetWarningTextWrapper,
  AssetWarningTitle,
  BannerTextWrapper,
  ConsequenceIcon,
  ConsequenceItem,
  ConsequenceText,
  ConsequenceTitle,
  ConsequencesList,
  Container,
  DangerBanner,
  DangerBannerDescription,
  DangerBannerTitle,
  DeleteButton,
  ExportKeyDescription,
  ExportKeyLink,
  WarningCard,
  WarningDescription
} from './DeleteAccountSection.styled'

// Pre-rendered icon elements (mirrors AccountSidebar's NAV_ITEMS) so the list map
// doesn't destructure a component into a PascalCase parameter.
const CONSEQUENCES = [
  { key: 'profile', icon: <AccountCircleRoundedIcon /> },
  { key: 'social', icon: <GroupRoundedIcon /> },
  { key: 'marketplace', icon: <StorefrontRoundedIcon /> },
  { key: 'credits', icon: <CardGiftcardRoundedIcon /> },
  { key: 'favorites', icon: <PlaceRoundedIcon /> },
  { key: 'notifications', icon: <NotificationsRoundedIcon /> }
] as const

// NOTE: This section (and its confirmation modal) only make sense for thirdweb
// in-app wallets — i.e. accounts created through the email / social-OTP login
// flow. Deletion unlinks the thirdweb profiles client-side; there is no
// equivalent action for self-custodial wallets (MetaMask, WalletConnect),
// whose keys the user controls directly.
const DeleteAccountSection = (props: DeleteAccountSectionProps) => {
  const { address, isMagic, onOpenConfirmModal, onGoToWallets, onGoToSecurity } = props
  const t = useFormatMessage()

  return (
    <Container data-role="delete-account-section">
      <DangerBanner>
        <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: '#FF2D55', flexShrink: 0 }} />
        <BannerTextWrapper>
          <DangerBannerTitle>{t('account.delete.danger_zone')}</DangerBannerTitle>
          <DangerBannerDescription>{t('account.delete.danger_description')}</DangerBannerDescription>
        </BannerTextWrapper>
      </DangerBanner>

      <WarningCard>
        <WarningDescription>{t('account.delete.warning')}</WarningDescription>
        <ConsequencesList>
          {CONSEQUENCES.map(({ key, icon }) => (
            <ConsequenceItem key={key}>
              <ConsequenceIcon>{icon}</ConsequenceIcon>
              <ConsequenceText>
                <ConsequenceTitle>{t(`account.delete.consequences.${key}.title`)}</ConsequenceTitle>
                {' - '}
                {t(`account.delete.consequences.${key}.description`)}
              </ConsequenceText>
            </ConsequenceItem>
          ))}
        </ConsequencesList>
      </WarningCard>

      <AssetWarningBox>
        <WarningAmberRoundedIcon sx={{ fontSize: 22, color: '#FFA500', flexShrink: 0, marginTop: '1px' }} />
        <AssetWarningTextWrapper>
          <AssetWarningTitle>{t('account.delete.asset_warning_title')}</AssetWarningTitle>
          <AssetWarningDescription>{t('account.delete.asset_warning_description')}</AssetWarningDescription>
          {/* Magic logins reveal their key from the Security tab (reveal.magic.link); thirdweb logins
              export theirs from the Wallets tab's wallet manager. Point each at the right place. */}
          <ExportKeyDescription>
            {t(isMagic ? 'account.delete.export_key_description_magic' : 'account.delete.export_key_description')}
          </ExportKeyDescription>
          <ExportKeyLink
            variant="text"
            onClick={isMagic ? onGoToSecurity : onGoToWallets}
            data-role={isMagic ? 'delete-account-go-to-security' : 'delete-account-go-to-wallets'}
          >
            {t(isMagic ? 'account.delete.export_key_link_magic' : 'account.delete.export_key_link')}
          </ExportKeyLink>
        </AssetWarningTextWrapper>
      </AssetWarningBox>

      <DeleteButton variant="contained" disabled={!address} onClick={onOpenConfirmModal} data-role="delete-account-open-confirm">
        {t('account.delete.delete_button')}
      </DeleteButton>
    </Container>
  )
}

export { DeleteAccountSection }
