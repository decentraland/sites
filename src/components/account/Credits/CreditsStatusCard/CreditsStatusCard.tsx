import { Button, Skeleton } from 'decentraland-ui2'
import { UserCreditsStatus } from '../../../../features/account-credits/account-credits.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { ActionRow, Card, Description, ErrorText, LearnMoreLink, StatusLine, StatusValue, Title } from './CreditsStatusCard.styled'

interface CreditsStatusCardProps {
  status: UserCreditsStatus | undefined
  isLoading: boolean
  isJoining?: boolean
  joinErrorKey?: string | null
  onJoin: () => void
  onLeave: () => void
}

const STATUS_LABEL_KEY: Record<UserCreditsStatus, string> = {
  [UserCreditsStatus.ENROLLED]: 'account.credits.status.enrolled',
  [UserCreditsStatus.OPTED_OUT]: 'account.credits.status.opted_out',
  [UserCreditsStatus.NOT_REGISTERED]: 'account.credits.status.not_registered'
}

const CreditsStatusCard = (props: CreditsStatusCardProps) => {
  const { status, isLoading, isJoining = false, joinErrorKey = null, onJoin, onLeave } = props
  const t = useFormatMessage()

  const isEnrolled = status === UserCreditsStatus.ENROLLED

  return (
    <Card data-role="credits-status-card">
      <Title>{t('account.credits.title')}</Title>
      {isLoading || status === undefined ? (
        <Skeleton variant="text" width={180} height={24} />
      ) : (
        <StatusLine data-role="credits-status">
          {t('account.credits.status_label')} <StatusValue highlight={isEnrolled}>{t(STATUS_LABEL_KEY[status])}</StatusValue>
        </StatusLine>
      )}
      <Description>
        {t('account.credits.description')}{' '}
        <LearnMoreLink href={t('account.credits.learn_more_url')} target="_blank" rel="noopener noreferrer" data-role="credits-learn-more">
          {t('account.credits.learn_more')}
        </LearnMoreLink>
      </Description>
      {!isLoading && status !== undefined ? (
        <ActionRow>
          {isEnrolled ? (
            <Button variant="contained" color="primary" onClick={onLeave} data-role="credits-leave-button">
              {t('account.credits.leave_button')}
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={onJoin} disabled={isJoining} data-role="credits-join-button">
              {t('account.credits.join_button')}
            </Button>
          )}
        </ActionRow>
      ) : null}
      {joinErrorKey ? <ErrorText data-role="credits-join-error">{t(joinErrorKey)}</ErrorText> : null}
    </Card>
  )
}

export { CreditsStatusCard }
export type { CreditsStatusCardProps }
