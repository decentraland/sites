import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HTMLAttributes, ReactNode, SyntheticEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from '@dcl/hooks'
import { Autocomplete } from 'decentraland-ui2'
import { useFeaturedAssetSearch } from '../../../../hooks/useFeaturedAssetSearch'
import { MIN_SEARCH_LENGTH, urnToOption } from '../../../../hooks/useFeaturedAssetSearch.helpers'
import type { FeaturedAssetKind, FeaturedAssetOption } from '../../../../hooks/useFeaturedAssetSearch.types'
import { EventTextField } from '../EventForm.styled'
import { FeaturedAssetOptionRow } from './FeaturedAssetOptionRow'
import { FeaturedAssetThumbnail } from './FeaturedAssetThumbnail'
import {
  FeaturedAssetGroup,
  FeaturedAssetGroupItems,
  FeaturedAssetGroupLabel,
  FeaturedAssetListbox,
  FeaturedAssetPaper,
  SelectedAssetAdornment
} from './FeaturedItemField.styled'

interface FeaturedItemFieldProps {
  /** The URN persisted on the event, or an empty string when nothing is featured. */
  value: string
  onChange: (urn: string) => void
  error?: boolean
  helperText?: string
}

const GROUP_LABEL_KEY: Record<FeaturedAssetKind, string> = {
  item: 'create_event.featured_item_group_items',
  collection: 'create_event.featured_item_group_collections'
}

/**
 * Featured-asset picker for the event form. Searches marketplace items and collections as the owner
 * types, and still accepts a pasted URN — including one the marketplace can't resolve, which is what
 * the plain text field this replaced allowed.
 */
function FeaturedItemField(props: FeaturedItemFieldProps) {
  const { value, onChange, error, helperText } = props
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selected, setSelected] = useState<FeaturedAssetOption | null>(null)

  // Only search while the dropdown is open: selecting an option makes MUI write the asset's name
  // into the input, which would otherwise fire a pointless round trip for a name we already have.
  const search = useFeaturedAssetSearch(isOpen ? inputValue : '')

  // Editing an event arrives with a bare URN. Show it verbatim straight away, then upgrade the row
  // to the real name and thumbnail once the marketplace resolves it.
  const needsHydration = Boolean(value) && selected?.urn !== value
  const hydration = useFeaturedAssetSearch(needsHydration ? value : '')

  useEffect(() => {
    if (!needsHydration) return
    // `status` gates this: committing on an errored lookup would end hydration for good, leaving the
    // field on the bare URN with no retry.
    if (hydration.status !== 'results') return
    const match = hydration.options.find(option => option.urn === value)
    if (match) setSelected(match)
  }, [needsHydration, hydration.options, hydration.status, value])

  const currentAsset = useMemo(() => {
    if (!value) return null
    return selected?.urn === value ? selected : urnToOption(value)
  }, [value, selected])

  // Each of these used to render as "no items or collections found", which claimed a search had run
  // when none had.
  const emptyMessage = useMemo(() => {
    if (search.status === 'too-short') return t('create_event.featured_item_min_length', { count: String(MIN_SEARCH_LENGTH) })
    if (search.status === 'error') return t('create_event.featured_item_error')
    return t('create_event.featured_item_no_results')
  }, [search.status, t])

  const handleChange = useCallback(
    (_event: SyntheticEvent, option: FeaturedAssetOption | null) => {
      setSelected(option)
      onChange(option?.urn ?? '')
    },
    [onChange]
  )

  const handleInputChange = useCallback((_event: SyntheticEvent, next: string) => setInputValue(next), [])

  const renderOption = useCallback(
    (optionProps: HTMLAttributes<HTMLLIElement>, option: FeaturedAssetOption) => (
      <FeaturedAssetOptionRow {...optionProps} key={option.urn} option={option} />
    ),
    []
  )

  const renderGroup = useCallback(
    (params: { key: string; group: string; children?: ReactNode }) => (
      <FeaturedAssetGroup key={params.key}>
        <FeaturedAssetGroupLabel>{t(GROUP_LABEL_KEY[params.group as FeaturedAssetKind] ?? params.group)}</FeaturedAssetGroupLabel>
        <FeaturedAssetGroupItems>{params.children}</FeaturedAssetGroupItems>
      </FeaturedAssetGroup>
    ),
    [t]
  )

  return (
    <Autocomplete<FeaturedAssetOption, false, false, false>
      options={search.options}
      value={currentAsset}
      inputValue={inputValue}
      open={isOpen && search.status !== 'idle'}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onChange={handleChange}
      onInputChange={handleInputChange}
      // The marketplace already ranked and filtered the results; re-filtering client-side would drop
      // rows that matched on a field the label doesn't show.
      filterOptions={options => options}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, selectedOption) => option.urn === selectedOption.urn}
      groupBy={option => option.kind}
      renderGroup={renderGroup}
      renderOption={renderOption}
      loading={search.status === 'loading'}
      loadingText={t('create_event.featured_item_searching')}
      noOptionsText={emptyMessage}
      PaperComponent={FeaturedAssetPaper}
      ListboxComponent={FeaturedAssetListbox}
      forcePopupIcon={false}
      autoHighlight
      // Without this, blurring after pasting a URN hits MUI's `clearOnBlur` branch and the value is
      // silently dropped — the event would save with no featured item and nothing would say so.
      // `autoHighlight` already highlights the row, so this commits exactly what the user sees.
      autoSelect
      handleHomeEndKeys
      clearIcon={<CloseIcon fontSize="small" />}
      clearText={t('create_event.featured_item_clear')}
      fullWidth
      renderInput={params => (
        <EventTextField
          {...params}
          variant="outlined"
          label={t('create_event.featured_item_label')}
          placeholder={t('create_event.featured_item_placeholder')}
          error={error}
          helperText={helperText}
          fullWidth
          InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
          InputProps={{
            ...params.InputProps,
            startAdornment: currentAsset ? (
              <SelectedAssetAdornment>
                <FeaturedAssetThumbnail thumbnails={currentAsset.thumbnails} size="small" />
              </SelectedAssetAdornment>
            ) : undefined
          }}
        />
      )}
    />
  )
}

export { FeaturedItemField }
export type { FeaturedItemFieldProps }
