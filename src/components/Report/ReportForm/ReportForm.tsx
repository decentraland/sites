import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useAnalytics } from '@dcl/hooks'
import { EthAddress } from '@dcl/schemas'
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from 'decentraland-ui2'
import { ReportReason } from '../../../features/report/report.types'
import type { ReportFormErrors, ReportFormState, UploadedFile } from '../../../features/report/report.types'
import { useSubmitReport } from '../../../features/report/useSubmitReport'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useReportFormDraft } from '../../../hooks/useReportFormDraft'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { SegmentEvent } from '../../../modules/segment'
import { redirectToAuth } from '../../../utils/authRedirect'
import { FileUpload } from './FileUpload'
import { FieldInputGroup, FieldInputHint, FieldWrapper, FormField } from './FormField'
import {
  CharacterCounter,
  ConfirmCheckbox,
  ConfirmError,
  ConfirmLabel,
  FooterLink,
  FooterText,
  FormBackground,
  FormCard,
  FormLogo,
  FormTitle,
  LogoWrapper,
  SignInAlert,
  SubmitButton,
  SubmitError,
  WalletMismatchAlert
} from './ReportForm.styled'

const REASON_LABEL_KEYS: Record<ReportReason, string> = {
  [ReportReason.SCAM_PHISHING]: 'component.report.form.reason_options.scam_phishing',
  [ReportReason.ILLEGAL_CONTENT]: 'component.report.form.reason_options.illegal_content',
  [ReportReason.HARASSMENT]: 'component.report.form.reason_options.harassment',
  [ReportReason.CHEATING]: 'component.report.form.reason_options.cheating',
  [ReportReason.IMPERSONATION]: 'component.report.form.reason_options.impersonation'
}

const DESCRIPTION_MAX = 500
const COMMENTS_MAX = 500

function ReportForm() {
  const formatMessage = useFormatMessage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { address } = useWalletAddress()
  const { identity, hasValidIdentity } = useAuthIdentity()
  const { isInitialized: analyticsInitialized, track } = useAnalytics()
  const { saveDraft, restoreDraft, clearDraft } = useReportFormDraft()
  const { submitReport, isSubmitting, error: submitError } = useSubmitReport({ identity })

  const playerAddressParam = searchParams.get('player_address') ?? ''
  const reportedAddressParam = searchParams.get('reported_address') ?? ''
  const walletAddress = address ?? ''

  const [formState, setFormState] = useState<ReportFormState>(() => ({
    playerAddress: walletAddress,
    reportedAddress: reportedAddressParam,
    reason: '',
    description: '',
    evidence: [],
    additionalComments: '',
    confirmAccuracy: false
  }))
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const draft = restoreDraft()
    if (!draft) return

    if (!searchParams.toString() && draft.searchParams) {
      setSearchParams(new URLSearchParams(draft.searchParams), { replace: true })
    }

    setFormState(prev => ({
      ...prev,
      ...(draft.reportedAddress && !searchParams.get('reported_address') ? { reportedAddress: draft.reportedAddress } : {}),
      reason: draft.reason,
      description: draft.description,
      additionalComments: draft.additionalComments
    }))
  }, [])

  useEffect(() => {
    setFormState(prev => ({ ...prev, playerAddress: walletAddress }))
  }, [walletAddress])

  useEffect(() => {
    if (reportedAddressParam) {
      setFormState(prev => ({ ...prev, reportedAddress: reportedAddressParam }))
    }
  }, [reportedAddressParam])

  const walletMismatch = useMemo(() => {
    if (!address || !playerAddressParam) return false
    return address.toLowerCase() !== playerAddressParam.toLowerCase()
  }, [address, playerAddressParam])

  const errors = useMemo<ReportFormErrors>(
    () => ({
      playerAddress: !EthAddress.validate(formState.playerAddress) ? formatMessage('component.report.form.errors.invalid_address') : '',
      reportedAddress: !EthAddress.validate(formState.reportedAddress) ? formatMessage('component.report.form.errors.invalid_address') : '',
      reason: !formState.reason ? formatMessage('component.report.form.errors.missing_reason') : '',
      description: !formState.description.trim() ? formatMessage('component.report.form.errors.missing_description') : '',
      evidence: formState.evidence.length === 0 ? formatMessage('component.report.form.errors.missing_evidence') : '',
      confirmAccuracy: !formState.confirmAccuracy ? formatMessage('component.report.form.errors.missing_confirmation') : ''
    }),
    [formState, formatMessage]
  )

  const hasErrors = useMemo(() => Object.values(errors).some(value => value !== ''), [errors])

  const handleFieldChange = useCallback(<TKey extends keyof ReportFormState>(field: TKey, value: ReportFormState[TKey]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleEvidenceChange = useCallback(
    (files: UploadedFile[]) => {
      handleFieldChange('evidence', files)
    },
    [handleFieldChange]
  )

  const handleSignInClick = useCallback(() => {
    saveDraft({
      searchParams: searchParams.toString(),
      reportedAddress: formState.reportedAddress,
      reason: formState.reason,
      description: formState.description,
      additionalComments: formState.additionalComments
    })
    redirectToAuth(window.location.pathname + window.location.search)
  }, [saveDraft, searchParams, formState])

  const handleSubmit = useCallback(async () => {
    setSubmitted(true)
    if (hasErrors || walletMismatch) return

    if (analyticsInitialized) {
      track(SegmentEvent.REPORT_PLAYER_SUBMIT_STARTED, { reason: formState.reason })
    }

    const success = await submitReport(formState)
    if (success) {
      clearDraft()
      if (analyticsInitialized) {
        track(SegmentEvent.REPORT_PLAYER_SUBMITTED, { reason: formState.reason })
      }
      navigate('/report/success', { state: { submitted: true } })
    } else if (analyticsInitialized) {
      track(SegmentEvent.REPORT_PLAYER_SUBMIT_FAILED, { reason: formState.reason })
    }
  }, [analyticsInitialized, clearDraft, formState, hasErrors, navigate, submitReport, track, walletMismatch])

  return (
    <FormBackground>
      <FormCard>
        <LogoWrapper>
          <FormLogo size="large" />
          <FormTitle variant="h3">{formatMessage('component.report.form.title')}</FormTitle>
        </LogoWrapper>

        {walletMismatch && <WalletMismatchAlert>{formatMessage('component.report.form.wallet_mismatch')}</WalletMismatchAlert>}

        <FormField
          number={1}
          label={formatMessage('component.report.form.your_wallet_label')}
          required
          helper={formatMessage('component.report.form.your_wallet_helper')}
          error={submitted ? errors.playerAddress : undefined}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={formatMessage('component.report.form.your_wallet_placeholder')}
            value={formState.playerAddress}
            disabled
          />
        </FormField>

        {!hasValidIdentity && (
          <SignInAlert>
            {formatMessage('component.report.form.sign_in_alert')}
            <Button variant="text" color="warning" size="small" onClick={handleSignInClick}>
              {formatMessage('component.report.form.sign_in_cta')}
            </Button>
          </SignInAlert>
        )}

        <FormField
          number={2}
          label={formatMessage('component.report.form.reported_label')}
          required
          helper={formatMessage('component.report.form.reported_helper')}
          error={submitted ? errors.reportedAddress : undefined}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={formatMessage('component.report.form.reported_placeholder')}
            value={formState.reportedAddress}
            onChange={event => handleFieldChange('reportedAddress', event.target.value)}
            disabled={!!reportedAddressParam}
          />
        </FormField>

        <FormField
          number={3}
          label={formatMessage('component.report.form.reason_label')}
          required
          helper={formatMessage('component.report.form.reason_helper')}
          error={submitted ? errors.reason : undefined}
        >
          <FormControl fullWidth size="small" error={submitted && !!errors.reason}>
            {!formState.reason && <InputLabel shrink={false}>{formatMessage('component.report.form.reason_placeholder')}</InputLabel>}
            <Select
              value={formState.reason}
              onChange={(event: SelectChangeEvent<ReportReason | ''>) => handleFieldChange('reason', event.target.value as ReportReason)}
              displayEmpty
            >
              {Object.values(ReportReason).map(value => (
                <MenuItem key={value} value={value}>
                  {formatMessage(REASON_LABEL_KEYS[value])}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormField>

        <FormField
          number={4}
          label={formatMessage('component.report.form.description_label')}
          required
          helper={formatMessage('component.report.form.description_helper')}
          error={submitted ? errors.description : undefined}
        >
          <FieldInputGroup>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={4}
              placeholder={formatMessage('component.report.form.description_placeholder')}
              value={formState.description}
              onChange={event => handleFieldChange('description', event.target.value.slice(0, DESCRIPTION_MAX))}
            />
            <CharacterCounter>{`${formState.description.length} / ${DESCRIPTION_MAX}`}</CharacterCounter>
            <FieldInputHint>{formatMessage('component.report.form.description_hint')}</FieldInputHint>
          </FieldInputGroup>
        </FormField>

        <FormField
          number={5}
          label={formatMessage('component.report.form.evidence_label')}
          required
          helper={formatMessage('component.report.form.evidence_helper')}
          error={submitted ? errors.evidence : undefined}
        >
          <FileUpload
            files={formState.evidence}
            onFilesChange={handleEvidenceChange}
            addFileLabel={formatMessage('component.report.form.evidence_add')}
            oversizedLabel={names => formatMessage('component.report.form.evidence_oversized', { names })}
          />
        </FormField>

        <FormField
          number={6}
          label={formatMessage('component.report.form.additional_label')}
          optional
          helper={formatMessage('component.report.form.additional_helper')}
        >
          <FieldInputGroup>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder={formatMessage('component.report.form.additional_placeholder')}
              value={formState.additionalComments}
              onChange={event => handleFieldChange('additionalComments', event.target.value.slice(0, COMMENTS_MAX))}
            />
            <CharacterCounter>{`${formState.additionalComments.length} / ${COMMENTS_MAX}`}</CharacterCounter>
          </FieldInputGroup>
        </FormField>

        <FieldWrapper>
          <ConfirmLabel
            control={
              <ConfirmCheckbox
                checked={formState.confirmAccuracy}
                onChange={event => handleFieldChange('confirmAccuracy', event.target.checked)}
                showError={submitted && !!errors.confirmAccuracy}
              />
            }
            label={formatMessage('component.report.form.confirmation_label')}
          />
          {submitted && errors.confirmAccuracy && <ConfirmError>{errors.confirmAccuracy}</ConfirmError>}
        </FieldWrapper>

        {submitError && <SubmitError>{formatMessage('component.report.form.errors.submit_failed')}</SubmitError>}

        <SubmitButton
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={walletMismatch || !hasValidIdentity || !formState.confirmAccuracy || isSubmitting}
        >
          {isSubmitting ? formatMessage('component.report.form.submit_in_progress') : formatMessage('component.report.form.submit')}
        </SubmitButton>
      </FormCard>

      <FooterText>
        {formatMessage('component.report.form.footer_lead')}
        <br />
        {formatMessage('component.report.form.footer_help_prefix')}{' '}
        <FooterLink href="https://decentraland.org/help" target="_blank" rel="noopener noreferrer">
          {formatMessage('component.report.form.footer_help_link')}
        </FooterLink>
        {formatMessage('component.report.form.footer_help_suffix')}
      </FooterText>
    </FormBackground>
  )
}

export { ReportForm }
