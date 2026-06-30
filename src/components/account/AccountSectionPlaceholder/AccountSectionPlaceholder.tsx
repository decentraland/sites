import { Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { PlaceholderContainer, PlaceholderTitle } from './AccountSectionPlaceholder.styled'

interface AccountSectionPlaceholderProps {
  title: string
}

/**
 * Temporary section body used by the Account scaffolding on the integration branch.
 * Each feature branch (wallets / notifications / credits / delete) replaces the page body
 * with its real UI; this placeholder never reaches master.
 */
const AccountSectionPlaceholder = ({ title }: AccountSectionPlaceholderProps) => {
  const t = useFormatMessage()
  return (
    <PlaceholderContainer data-role="account-section-placeholder">
      <PlaceholderTitle variant="h4">{title}</PlaceholderTitle>
      <Typography variant="body1" color="text.secondary">
        {t('account.coming_soon')}
      </Typography>
    </PlaceholderContainer>
  )
}

export { AccountSectionPlaceholder }
