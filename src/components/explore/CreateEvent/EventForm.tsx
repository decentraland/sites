import { useCallback, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventIcon from '@mui/icons-material/Event'
import { useTranslation } from '@dcl/hooks'
import { useCreateEventForm } from '../../hooks/useCreateEventForm'
import { ImageUpload } from './ImageUpload'
import {
  AddCoverBold,
  AddCoverLight,
  AddCoverText,
  AddVerticalCoverButton,
  CancelButton,
  ContentContainer,
  CoordPrefix,
  CoordinatesRow,
  DateTimeGrid,
  DateTimeRow,
  DateTimeSection,
  DescriptionFields,
  DescriptionHeader,
  DescriptionLabel,
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
  PreviewLabel,
  PreviewToggle,
  RepeatFields,
  RepeatLabel,
  RepeatRow,
  ReviewText,
  RightSection,
  SectionHeading,
  SubmitButton
} from './EventForm.styled'

type EventFormProps = {
  onCancel: () => void
}

function EventForm({ onCancel }: EventFormProps) {
  const { t } = useTranslation()
  const {
    form,
    errors,
    setField,
    handleImageSelect,
    handleImageRemove,
    handleVerticalImageSelect,
    handleVerticalImageRemove,
    isFormValid,
    isSubmitting,
    handleSubmit
  } = useCreateEventForm()
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const verticalInputRef = useRef<HTMLInputElement>(null)

  const handleVerticalClick = useCallback(() => {
    if (form.verticalImagePreviewUrl) {
      handleVerticalImageRemove()
    } else {
      verticalInputRef.current?.click()
    }
  }, [form.verticalImagePreviewUrl, handleVerticalImageRemove])

  const handleVerticalFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleVerticalImageSelect(file)
      }
      if (verticalInputRef.current) {
        verticalInputRef.current.value = ''
      }
    },
    [handleVerticalImageSelect]
  )

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
                <AddCoverBold>{form.verticalImagePreviewUrl ? 'Remove Vertical Cover' : 'Add Vertical Cover'}</AddCoverBold>
                <AddCoverLight> (Optional)</AddCoverLight>
              </AddCoverText>
            </AddVerticalCoverButton>
            <input
              ref={verticalInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleVerticalFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            {form.verticalImageError && <ReviewText sx={{ color: 'error.main' }}>{form.verticalImageError}</ReviewText>}
          </ImageSection>

          <DescriptionFields>
            <DescriptionHeader>
              <DescriptionLabel>Description</DescriptionLabel>
              <PreviewToggle>
                <PreviewLabel>PREVIEW</PreviewLabel>
                <EventSwitch checked={previewEnabled} onChange={(_, checked) => setPreviewEnabled(checked)} size="medium" />
              </PreviewToggle>
            </DescriptionHeader>

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
          <EventDetailsBlock>
            <SectionHeading>{t('create_event.event_details')}</SectionHeading>

            <DateTimeSection>
              <DateTimeGrid>
                {/* Starts */}
                <DateTimeRow>
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.starts')}
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
                </DateTimeRow>

                {/* Ends */}
                <DateTimeRow>
                  <EventTextField
                    variant="outlined"
                    label={t('create_event.ends')}
                    type="date"
                    value={form.endDate}
                    onChange={e => setField('endDate', e.target.value)}
                    error={Boolean(errors.endDate)}
                    helperText={errors.endDate}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: <EventIcon sx={{ color: '#a09ba8', fontSize: 24, pointerEvents: 'none' }} />
                    }}
                  />
                  <EventTextField
                    variant="outlined"
                    type="time"
                    value={form.endTime}
                    onChange={e => setField('endTime', e.target.value)}
                    error={Boolean(errors.endTime)}
                    helperText={errors.endTime}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: <AccessTimeFilledIcon sx={{ color: '#a09ba8', fontSize: 24, pointerEvents: 'none' }} />
                    }}
                  />
                </DateTimeRow>
              </DateTimeGrid>

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
                  label={t('create_event.ends')}
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
            <LocationLabel>Location</LocationLabel>
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
            </LocationRow>
          </LocationBlock>

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
            <ReviewText>{t('create_event.review_notice')}</ReviewText>
          </EmailSection>
        </RightSection>
      </FormColumns>

      {errors.submit && <ReviewText sx={{ color: 'error.main', textAlign: 'center' }}>{errors.submit}</ReviewText>}

      <FormActions>
        <CancelButton type="button" onClick={onCancel}>
          {t('create_event.cancel')}
        </CancelButton>
        <SubmitButton type="button" disabled={!isFormValid || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? t('create_event.submitting') : t('create_event.submit')}
        </SubmitButton>
      </FormActions>
    </ContentContainer>
  )
}

export { EventForm }
export type { EventFormProps }
