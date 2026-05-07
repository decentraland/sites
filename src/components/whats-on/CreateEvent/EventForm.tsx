import { useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventIcon from '@mui/icons-material/Event'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useTranslation } from '@dcl/hooks'
import { Tooltip } from 'decentraland-ui2'
import { useGetCommunitiesQuery, useGetWorldNamesQuery } from '../../../features/experiences/events'
import type { EventEntry } from '../../../features/experiences/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCreateEventForm } from '../../../hooks/useCreateEventForm'
import { FREQUENCY_MAP, parseDurationMs } from '../../../hooks/useCreateEventForm.helpers'
import type { CreateEventFormState } from '../../../hooks/useCreateEventForm.types'
import { buildEventJumpInUrl } from '../../../utils/whatsOnUrl'
import { EventDetailModal } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { DurationField } from './DurationField'
import { ImageUpload } from './ImageUpload'
import { VerticalCoverPanel } from './VerticalCoverPanel'
import {
  AddCoverBold,
  AddCoverLight,
  AddCoverText,
  AddVerticalCoverButton,
  CancelButton,
  ContentContainer,
  CoordPrefix,
  CoordinatesRow,
  DateTimeRow,
  DateTimeSection,
  DescriptionFields,
  EmailSection,
  EventDetailsBlock,
  EventFormControl,
  EventInputLabel,
  EventMenuItem,
  EventSelect,
  EventSwitch,
  EventTextArea,
  EventTextField,
  FormActions,
  FormColumns,
  ImageSection,
  LeftCard,
  LocationBlock,
  LocationLabel,
  LocationRow,
  PreviewButton,
  RejectionAlert,
  RepeatFields,
  RepeatLabel,
  RepeatRow,
  ReviewBar,
  ReviewNotice,
  ReviewText,
  RightSection,
  RightSectionFields,
  RightSectionFooter,
  SectionHeading,
  SubmitButton,
  SubmitErrorMessage
} from './EventForm.styled'

const PREVIEW_REQUIRED_FIELDS: Array<keyof CreateEventFormState> = ['name', 'startDate', 'startTime', 'duration']

function buildPreviewData(form: CreateEventFormState, address: string | undefined, initialEvent: EventEntry | null): ModalEventData {
  const startDate = form.startDate && form.startTime ? new Date(`${form.startDate}T${form.startTime}`) : null
  const startAt = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString() : null
  const durationMs = parseDurationMs(form.duration)
  const finishAt = startAt && durationMs !== null ? new Date(new Date(startAt).getTime() + durationMs).toISOString() : null

  const isWorld = form.location === 'world'
  const x = isWorld ? 0 : Number(form.coordX) || 0
  const y = isWorld ? 0 : Number(form.coordY) || 0

  const creatorAddress = initialEvent?.user || address
  const creatorName = initialEvent?.user_name || undefined

  return {
    id: 'preview',
    name: form.name.trim(),
    description: form.description.trim() || null,
    image: form.imagePreviewUrl,
    x,
    y,
    creatorAddress,
    creatorName,
    startAt,
    finishAt,
    recurrent: form.repeatEnabled,
    recurrentFrequency: form.repeatEnabled ? FREQUENCY_MAP[form.frequency] ?? null : null,
    recurrentDates: [],
    totalAttendees: 0,
    attending: false,
    live: false,
    categories: [],
    url: buildEventJumpInUrl(x, y),
    isEvent: false
  }
}

type EventFormProps = {
  onCancel: () => void
  onSuccess: () => void
  initialEvent?: EventEntry | null
  initialCommunityId?: string | null
  initialOpenPreview?: boolean
}

function EventForm({ onCancel, onSuccess, initialEvent = null, initialCommunityId = null, initialOpenPreview = false }: EventFormProps) {
  const { t } = useTranslation()
  const {
    form,
    errors,
    mode,
    setField,
    markRequiredFields,
    handleImageSelect,
    handleImageRemove,
    handleVerticalImageSelect,
    handleVerticalImageRemove,
    isSubmitting,
    handleSubmit
  } = useCreateEventForm({ onSuccess, initialEvent, initialCommunityId })
  const { identity, address } = useAuthIdentity()
  const { data: worldNames = [] } = useGetWorldNamesQuery(undefined, { skip: form.location !== 'world' })
  const { data: communities = [] } = useGetCommunitiesQuery({ identity }, { skip: !identity })
  const [verticalPanelOpen, setVerticalPanelOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialOpenPreview)
  const showVerticalPanel = verticalPanelOpen || Boolean(form.verticalImagePreviewUrl)

  const missingPreviewFields = useMemo(() => PREVIEW_REQUIRED_FIELDS.filter(field => !String(form[field] ?? '').trim()), [form])
  const imageMissing = !form.imageUrl
  const canPreview = missingPreviewFields.length === 0 && !imageMissing
  const previewData = useMemo(
    () => (isPreviewOpen ? buildPreviewData(form, address, initialEvent) : null),
    [isPreviewOpen, form, address, initialEvent]
  )

  const handlePreviewClick = useCallback(() => {
    if (canPreview) {
      setIsPreviewOpen(true)
      return
    }
    if (missingPreviewFields.length > 0) {
      markRequiredFields(missingPreviewFields)
    }
    if (imageMissing && !form.imageError) {
      setField('imageError', 'image_required')
    }
  }, [canPreview, form.imageError, imageMissing, markRequiredFields, missingPreviewFields, setField])

  const handlePreviewClose = useCallback(() => {
    setIsPreviewOpen(false)
  }, [])

  const handleVerticalClick = useCallback(() => {
    if (form.verticalImagePreviewUrl) {
      handleVerticalImageRemove()
      setVerticalPanelOpen(false)
    } else {
      setVerticalPanelOpen(prev => !prev)
    }
  }, [form.verticalImagePreviewUrl, handleVerticalImageRemove])

  const handleVerticalPanelRemove = useCallback(() => {
    handleVerticalImageRemove()
    setVerticalPanelOpen(false)
  }, [handleVerticalImageRemove])

  return (
    <ContentContainer>
      <FormColumns>
        {/* Left Column — Image + Description */}
        <LeftCard>
          <ImageSection>
            <ImageUpload
              imagePreviewUrl={form.imagePreviewUrl}
              imageError={form.imageError}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
            />
            <AddVerticalCoverButton type="button" onClick={handleVerticalClick}>
              <AddIcon sx={{ color: '#fcfcfc', fontSize: 24 }} />
              <AddCoverText>
                <AddCoverBold>
                  {form.verticalImagePreviewUrl ? t('create_event.remove_vertical_cover') : t('create_event.add_vertical_cover')}
                </AddCoverBold>
                <AddCoverLight> {t('create_event.recommended_parenthetical')}</AddCoverLight>
              </AddCoverText>
            </AddVerticalCoverButton>
            {(showVerticalPanel || form.verticalImageError) && (
              <VerticalCoverPanel
                previewUrl={form.verticalImagePreviewUrl}
                imageError={form.verticalImageError}
                onSelect={handleVerticalImageSelect}
                onRemove={handleVerticalPanelRemove}
              />
            )}
          </ImageSection>

          <DescriptionFields>
            <EventTextField
              variant="outlined"
              label={t('create_event.event_name')}
              placeholder={t('create_event.name_placeholder')}
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <EventTextArea
              variant="outlined"
              label={t('create_event.event_description')}
              placeholder={t('create_event.description_placeholder')}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description}
              fullWidth
              multiline
              minRows={3}
              InputLabelProps={{ shrink: true }}
            />
          </DescriptionFields>
        </LeftCard>

        {/* Right Column — Event Details */}
        <RightSection>
          <RightSectionFields>
            {initialEvent?.rejected && (
              <RejectionAlert severity="error" variant="standard">
                {initialEvent.rejection_reason
                  ? t('create_event.rejected_alert', { reason: initialEvent.rejection_reason })
                  : t('create_event.rejected_alert_no_reason')}
              </RejectionAlert>
            )}
            <EventDetailsBlock>
              <SectionHeading>{t('create_event.event_details')}</SectionHeading>

              <DateTimeSection>
                <DateTimeRow>
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.date')}
                    type="date"
                    value={form.startDate}
                    onChange={e => setField('startDate', e.target.value)}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: <EventIcon sx={{ color: '#a09ba8', fontSize: 24, pointerEvents: 'none' }} />
                    }}
                  />
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.start')}
                    type="time"
                    value={form.startTime}
                    onChange={e => setField('startTime', e.target.value)}
                    error={Boolean(errors.startTime)}
                    helperText={errors.startTime}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: <AccessTimeFilledIcon sx={{ color: '#a09ba8', fontSize: 24, pointerEvents: 'none' }} />
                    }}
                  />
                  <DurationField
                    value={form.duration}
                    startTime={form.startTime}
                    onChange={value => setField('duration', value)}
                    error={errors.duration}
                    label={t('create_event.duration')}
                  />
                </DateTimeRow>

                {/* Repeat Event */}
                <RepeatRow>
                  <RepeatLabel>{t('create_event.repeat_event')}</RepeatLabel>
                  <EventSwitch checked={form.repeatEnabled} onChange={(_, checked) => setField('repeatEnabled', checked)} size="medium" />
                </RepeatRow>

                <RepeatFields $visible={form.repeatEnabled}>
                  <EventFormControl variant="outlined" fullWidth>
                    <EventInputLabel shrink>{t('create_event.frequency')}</EventInputLabel>
                    <EventSelect
                      value={form.frequency}
                      onChange={e => setField('frequency', e.target.value as string)}
                      label={t('create_event.frequency')}
                      notched
                    >
                      <EventMenuItem value="every_day">{t('create_event.every_day')}</EventMenuItem>
                      <EventMenuItem value="every_week">{t('create_event.every_week')}</EventMenuItem>
                      <EventMenuItem value="every_month">{t('create_event.every_month')}</EventMenuItem>
                    </EventSelect>
                  </EventFormControl>
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.repeat_until')}
                    type="date"
                    value={form.repeatEndDate}
                    onChange={e => setField('repeatEndDate', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </RepeatFields>
              </DateTimeSection>
            </EventDetailsBlock>

            {/* Location */}
            <LocationBlock>
              <LocationLabel>{t('create_event.location')}</LocationLabel>
              <LocationRow>
                <EventFormControl variant="outlined" fullWidth sx={{ flex: 1 }}>
                  <EventInputLabel shrink>{t('create_event.location_type')}</EventInputLabel>
                  <EventSelect
                    value={form.location}
                    onChange={e => setField('location', e.target.value as string)}
                    label={t('create_event.location_type')}
                    notched
                  >
                    <EventMenuItem value="land">{t('create_event.land')}</EventMenuItem>
                    <EventMenuItem value="world">{t('create_event.world')}</EventMenuItem>
                  </EventSelect>
                </EventFormControl>
                {form.location === 'world' ? (
                  <EventFormControl variant="outlined" fullWidth error={Boolean(errors.world)} sx={{ flex: 2 }}>
                    <EventInputLabel shrink>{t('create_event.world')}</EventInputLabel>
                    <EventSelect
                      value={form.world}
                      onChange={e => setField('world', e.target.value as string)}
                      label={t('create_event.world')}
                      notched
                      displayEmpty
                    >
                      <EventMenuItem value="">{t('create_event.world_placeholder')}</EventMenuItem>
                      {worldNames.map(name => (
                        <EventMenuItem key={name} value={name}>
                          {name}
                        </EventMenuItem>
                      ))}
                    </EventSelect>
                  </EventFormControl>
                ) : (
                  <CoordinatesRow>
                    <EventTextField
                      variant="outlined"
                      label={t('create_event.latitude')}
                      value={form.coordX}
                      onChange={e => setField('coordX', e.target.value)}
                      error={Boolean(errors.coordX)}
                      helperText={errors.coordX}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <CoordPrefix position="start">X</CoordPrefix>
                      }}
                    />
                    <EventTextField
                      variant="outlined"
                      label={t('create_event.altitude')}
                      value={form.coordY}
                      onChange={e => setField('coordY', e.target.value)}
                      error={Boolean(errors.coordY)}
                      helperText={errors.coordY}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <CoordPrefix position="start">Y</CoordPrefix>
                      }}
                    />
                  </CoordinatesRow>
                )}
              </LocationRow>
            </LocationBlock>

            {communities.length > 0 && (
              <LocationBlock>
                <EventFormControl variant="outlined" fullWidth>
                  <EventInputLabel shrink>{t('create_event.community')}</EventInputLabel>
                  <EventSelect
                    value={form.communityId}
                    onChange={e => setField('communityId', e.target.value as string)}
                    label={t('create_event.community')}
                    notched
                    displayEmpty
                  >
                    <EventMenuItem value="">{t('create_event.community_none')}</EventMenuItem>
                    {communities.map(community => (
                      <EventMenuItem key={community.id} value={community.id}>
                        {community.name}
                      </EventMenuItem>
                    ))}
                  </EventSelect>
                </EventFormControl>
              </LocationBlock>
            )}

            {/* Email */}
            <EmailSection>
              <EventTextField
                variant="outlined"
                label={t('create_event.email_label')}
                placeholder={t('create_event.email_placeholder')}
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </EmailSection>
          </RightSectionFields>

          <RightSectionFooter>
            {errors.submit && <SubmitErrorMessage>{errors.submit}</SubmitErrorMessage>}

            <ReviewBar>
              <ReviewNotice>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#a09ba8' }} />
                <ReviewText>{t('create_event.review_notice')}</ReviewText>
              </ReviewNotice>
              <Tooltip title={canPreview ? '' : t('create_event.preview_disabled_tooltip')} arrow disableInteractive>
                <PreviewButton type="button" $enabled={canPreview} aria-disabled={!canPreview} onClick={handlePreviewClick}>
                  {t('create_event.preview')}
                  <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                </PreviewButton>
              </Tooltip>
            </ReviewBar>

            <FormActions>
              <CancelButton type="button" onClick={onCancel}>
                {t('create_event.cancel')}
              </CancelButton>
              <SubmitButton
                type="button"
                disabled={
                  isSubmitting ||
                  form.isUploadingImage ||
                  form.isUploadingVerticalImage ||
                  Boolean(form.imageError) ||
                  Boolean(form.verticalImageError)
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? t('create_event.submitting') : mode === 'edit' ? t('create_event.save_changes') : t('create_event.submit')}
              </SubmitButton>
            </FormActions>
          </RightSectionFooter>
        </RightSection>
      </FormColumns>

      <EventDetailModal open={isPreviewOpen} onClose={handlePreviewClose} data={previewData} />
    </ContentContainer>
  )
}

export { EventForm }
export type { EventFormProps }
