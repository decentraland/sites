import { useCallback, useId, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventIcon from '@mui/icons-material/Event'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from '@dcl/hooks'
import { FormControlLabel, FormHelperText, Tooltip } from 'decentraland-ui2'
import { useGetCommunitiesQuery, useGetWorldNamesQuery } from '../../../features/events'
import type { EventEntry } from '../../../features/events'
import { useEventFeaturedItemSearch } from '../../../features/events/events.flags'
import { RoleType, useGetUserDCLNamesQuery, useGetUserLandsQuery } from '../../../features/storage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCreateEventForm } from '../../../hooks/useCreateEventForm'
import {
  RECURRENCE_OPTIONS,
  computeUpcomingOccurrences,
  localDateToEndOfDayIso,
  parseDurationMs,
  recurrenceToApi
} from '../../../hooks/useCreateEventForm.helpers'
import type { CreateEventFormState } from '../../../hooks/useCreateEventForm.types'
import { formatLocalDate, formatLocalTime, formatUtcTime, getUtcDayDelta } from '../../../utils/whatsOnTime'
import { buildEventJumpInUrl } from '../../../utils/whatsOnUrl'
import { EventDetailModal } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { DurationField } from './DurationField'
import { FeaturedItemField } from './FeaturedItemField'
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
  DailyDurationDisclaimer,
  DailyDurationDisclaimerText,
  DateTimeRow,
  DateTimeSection,
  DeleteButton,
  DescriptionFields,
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
  FormFieldSection,
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
  ReviewWarningAlert,
  RightSection,
  RightSectionFields,
  RightSectionFooter,
  SectionHeading,
  SubmitButton,
  SubmitErrorMessage,
  UpcomingDateItem,
  UpcomingDatesEmpty,
  UpcomingDatesGroup,
  UpcomingDatesLabel,
  UpcomingDatesList
} from './EventForm.styled'

const PREVIEW_REQUIRED_FIELDS: Array<keyof CreateEventFormState> = ['name', 'startDate', 'startTime', 'duration']

function buildPreviewData(
  form: CreateEventFormState,
  address: string | undefined,
  initialEvent: EventEntry | null,
  isFeaturedItemEnabled: boolean
): ModalEventData {
  const startDate = form.startDate && form.startTime ? new Date(`${form.startDate}T${form.startTime}`) : null
  const startAt = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString() : null
  const durationMs = parseDurationMs(form.duration)
  const finishAt = startAt && durationMs !== null ? new Date(new Date(startAt).getTime() + durationMs).toISOString() : null

  const isWorld = form.location === 'world'
  const x = isWorld ? 0 : Number(form.coordX) || 0
  const y = isWorld ? 0 : Number(form.coordY) || 0

  const creatorAddress = initialEvent?.user || address
  const creatorName = initialEvent?.user_name || undefined

  const previewUntil = form.repeatEnabled && form.repeatEndDate ? localDateToEndOfDayIso(form.repeatEndDate) : null
  const recurrenceApi = form.repeatEnabled ? recurrenceToApi(form.recurrence) : null

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
    recurrentFrequency: recurrenceApi?.frequency ?? null,
    recurrentInterval: recurrenceApi?.interval ?? null,
    recurrentCount: null,
    recurrentUntil: previewUntil,
    // Single-weekday recurrence: no per-weekday mask, so the modal derives the weekday from startAt.
    recurrentByDay: undefined,
    recurrentDates: [],
    totalAttendees: 0,
    attending: false,
    live: false,
    categories: [],
    url: buildEventJumpInUrl(x, y),
    realm: isWorld ? form.world.trim() || undefined : undefined,
    isWorld,
    placeName: null,
    isEvent: false,
    featuredItem: isFeaturedItemEnabled ? form.featuredItem.trim() || null : null
  }
}

type EventFormProps = {
  onCancel: () => void
  onSuccess: () => void
  onDelete?: () => void
  initialEvent?: EventEntry | null
  initialCommunityId?: string | null
  initialOpenPreview?: boolean
}

function EventForm({
  onCancel,
  onSuccess,
  onDelete,
  initialEvent = null,
  initialCommunityId = null,
  initialOpenPreview = false
}: EventFormProps) {
  const { t, locale } = useTranslation()
  const {
    form,
    errors,
    mode,
    requiresModerationReview,
    showDailyDurationWarning,
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
  const isFeaturedItemSearchEnabled = useEventFeaturedItemSearch()
  const [onlyOwned, setOnlyOwned] = useState(false)
  const filterByOwner = onlyOwned && Boolean(address)
  const isWorld = form.location === 'world'
  const locationLabelId = useId()
  const locationStatusId = useId()
  const worldNames = useGetWorldNamesQuery(undefined, { skip: !isWorld })
  const ownedNames = useGetUserDCLNamesQuery(isWorld && onlyOwned && address ? { address } : skipToken)
  const ownedLands = useGetUserLandsQuery(!isWorld && onlyOwned && address ? { address } : skipToken)
  const { currentData: communities = [] } = useGetCommunitiesQuery({ identity }, { skip: !identity })
  const [verticalPanelOpen, setVerticalPanelOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialOpenPreview)
  const showVerticalPanel = verticalPanelOpen || Boolean(form.verticalImagePreviewUrl)

  const locationOptions = useMemo(() => {
    if (isWorld) {
      const names = worldNames.data ?? []
      const owned = new Set(ownedNames.currentData?.map(name => name.toLowerCase()))
      return names.filter(name => !filterByOwner || owned.has(name.toLowerCase())).map(name => ({ value: name, label: name }))
    }

    return (ownedLands.currentData ?? [])
      .filter(land => land.role === RoleType.OWNER)
      .flatMap(({ name, parcels, x, y }) => {
        const positions = parcels ?? [{ x, y }]
        return positions.flatMap(({ x, y }) => {
          if (!Number.isInteger(x) || !Number.isInteger(y)) return []
          const value = `${x},${y}`
          return [{ value, label: `${name} (${value})` }]
        })
      })
  }, [isWorld, filterByOwner, worldNames.data, ownedNames.currentData, ownedLands.currentData])
  const ownedLocationsFailed = isWorld ? worldNames.isError || ownedNames.isError : ownedLands.isError
  const ownedLocationsLoading = isWorld ? worldNames.isFetching || ownedNames.isFetching : ownedLands.isFetching
  const visibleLocations = filterByOwner && ownedLocationsFailed ? [] : locationOptions
  const locationValue = isWorld ? form.world : `${form.coordX},${form.coordY}`
  const currentLocation = isWorld ? form.world : form.coordX && form.coordY && locationValue
  const selectedLocation = visibleLocations.find(option => option.value === locationValue)
  const locationPlaceholder = t(isWorld ? 'create_event.world_placeholder' : 'create_event.land_placeholder')
  const locationStatus =
    filterByOwner &&
    (ownedLocationsFailed
      ? t('create_event.owned_locations_error')
      : ownedLocationsLoading
        ? t('create_event.owned_locations_loading')
        : visibleLocations.length === 0
          ? t('create_event.owned_locations_empty')
          : undefined)
  const locationError = isWorld ? errors.world : errors.coordX || errors.coordY

  const missingPreviewFields = useMemo(() => PREVIEW_REQUIRED_FIELDS.filter(field => !String(form[field] ?? '').trim()), [form])

  const startUtcPreview = useMemo(() => {
    if (!form.startDate || !form.startTime) return null
    const localStart = new Date(`${form.startDate}T${form.startTime}`)
    if (Number.isNaN(localStart.getTime())) return null
    const iso = localStart.toISOString()
    const time = formatUtcTime(iso, locale)
    const delta = getUtcDayDelta(iso)
    if (delta === 1) return t('event_time.form_utc_preview_next_day', { time })
    if (delta === -1) return t('event_time.form_utc_preview_previous_day', { time })
    return t('event_time.form_utc_preview', { time })
  }, [form.startDate, form.startTime, locale, t])

  const upcomingDates = useMemo(
    () => (form.repeatEnabled ? computeUpcomingOccurrences(form.startDate, form.startTime, form.recurrence, form.repeatEndDate) : []),
    [form.repeatEnabled, form.startDate, form.startTime, form.recurrence, form.repeatEndDate]
  )

  const imageMissing = !form.imageUrl
  const canPreview = missingPreviewFields.length === 0 && !imageMissing
  const previewData = useMemo(
    () => (isPreviewOpen ? buildPreviewData(form, address, initialEvent, isFeaturedItemSearchEnabled) : null),
    [isPreviewOpen, form, address, initialEvent, isFeaturedItemSearchEnabled]
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
            {requiresModerationReview && (
              <ReviewWarningAlert severity="warning" variant="standard">
                {t('create_event.approved_edit_warning')}
              </ReviewWarningAlert>
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
                    helperText={errors.startTime || startUtcPreview || undefined}
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
                    <EventInputLabel shrink>{t('create_event.recurrence')}</EventInputLabel>
                    <EventSelect
                      value={form.recurrence}
                      onChange={e => setField('recurrence', e.target.value as string)}
                      label={t('create_event.recurrence')}
                      notched
                    >
                      {RECURRENCE_OPTIONS.map(option => (
                        <EventMenuItem key={option} value={option}>
                          {t(`create_event.${option}`)}
                        </EventMenuItem>
                      ))}
                    </EventSelect>
                  </EventFormControl>
                  {showDailyDurationWarning && (
                    <DailyDurationDisclaimer data-testid="daily-duration-disclaimer">
                      <WarningAmberRoundedIcon fontSize="small" />
                      <DailyDurationDisclaimerText>{t('create_event.daily_duration_warning')}</DailyDurationDisclaimerText>
                    </DailyDurationDisclaimer>
                  )}
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.repeat_until')}
                    type="date"
                    value={form.repeatEndDate}
                    onChange={e => setField('repeatEndDate', e.target.value)}
                    error={Boolean(errors.repeatEndDate)}
                    helperText={errors.repeatEndDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <UpcomingDatesGroup>
                    <UpcomingDatesLabel>{t('create_event.upcoming_dates_label')}</UpcomingDatesLabel>
                    {upcomingDates.length > 0 ? (
                      <UpcomingDatesList>
                        {upcomingDates.map(date => {
                          const iso = date.toISOString()
                          return (
                            <UpcomingDateItem key={iso}>
                              {formatLocalDate(iso, locale)} · {formatLocalTime(iso, locale)}
                            </UpcomingDateItem>
                          )
                        })}
                      </UpcomingDatesList>
                    ) : (
                      <UpcomingDatesEmpty>{t('create_event.upcoming_dates_empty')}</UpcomingDatesEmpty>
                    )}
                  </UpcomingDatesGroup>
                </RepeatFields>
              </DateTimeSection>
            </EventDetailsBlock>

            {/* Location */}
            <LocationBlock>
              <LocationLabel>{t('create_event.location')}</LocationLabel>
              {address && (
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={<EventSwitch checked={onlyOwned} onChange={(_, checked) => setOnlyOwned(checked)} size="medium" />}
                  label={t('create_event.only_my_locations')}
                />
              )}
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
                {isWorld || filterByOwner ? (
                  <EventFormControl variant="outlined" fullWidth error={Boolean(locationError)} sx={{ flex: 2 }}>
                    <EventInputLabel id={locationLabelId} shrink>
                      {t(isWorld ? 'create_event.world' : 'create_event.land')}
                    </EventInputLabel>
                    <EventSelect
                      value={selectedLocation?.value ?? ''}
                      onChange={e => {
                        const value = e.target.value as string
                        if (isWorld) {
                          setField('world', value)
                        } else if (value) {
                          const [x, y] = value.split(',')
                          setField('coordX', x)
                          setField('coordY', y)
                        }
                      }}
                      label={t(isWorld ? 'create_event.world' : 'create_event.land')}
                      labelId={locationLabelId}
                      aria-describedby={locationStatus || locationError ? locationStatusId : undefined}
                      renderValue={() => selectedLocation?.label ?? (currentLocation || locationPlaceholder)}
                      notched
                      displayEmpty
                    >
                      <EventMenuItem
                        value=""
                        disabled={!isWorld}
                        onClick={isWorld && form.world && !selectedLocation ? () => setField('world', '') : undefined}
                      >
                        {locationPlaceholder}
                      </EventMenuItem>
                      {visibleLocations.map(({ value, label }) => (
                        <EventMenuItem key={value} value={value}>
                          {label}
                        </EventMenuItem>
                      ))}
                    </EventSelect>
                    {(locationStatus || locationError) && (
                      <FormHelperText id={locationStatusId} aria-live="polite">
                        {locationStatus || locationError}
                      </FormHelperText>
                    )}
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
            {/* Featured Item — the whole feature sits behind `dapps-event-featured-item-search`.
                Off (and while the flag loads) the field is not rendered at all. A `featured_item`
                already saved on the event is untouched: it stays in form state and is still sent on
                submit, it just cannot be seen or edited while the flag is off. */}
            {isFeaturedItemSearchEnabled && (
              <FormFieldSection>
                <FeaturedItemField
                  value={form.featuredItem}
                  onChange={urn => setField('featuredItem', urn)}
                  error={Boolean(errors.featuredItem)}
                  helperText={errors.featuredItem}
                />
              </FormFieldSection>
            )}
            {/* Email */}
            <FormFieldSection>
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
            </FormFieldSection>
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
              {mode === 'edit' && onDelete && (
                <DeleteButton type="button" onClick={onDelete}>
                  {t('event_detail.delete')}
                  <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                </DeleteButton>
              )}
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
