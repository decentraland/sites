import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { FeaturedAssetOption, FeaturedAssetSearchResult } from '../../../../hooks/useFeaturedAssetSearch.types'
import { FeaturedItemField } from './FeaturedItemField'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AutocompleteProps = Record<string, any>

// `decentraland-ui2` is ESM-only under Jest, so the Autocomplete is reduced to the surface this
// component actually drives: the rendered input, the grouped options, and the open/typing/select
// callbacks.
jest.mock('decentraland-ui2', () => ({
  Autocomplete: (props: AutocompleteProps) => {
    // Exercise the inline callbacks the real Autocomplete drives so they are covered here too.
    const visible = props.filterOptions(props.options) as FeaturedAssetOption[]
    const matchesValue = props.value
      ? visible.some((option: FeaturedAssetOption) => props.isOptionEqualToValue(option, props.value))
      : false
    const groups = new Map<string, FeaturedAssetOption[]>()
    for (const option of visible) {
      const group = props.groupBy(option)
      groups.set(group, [...(groups.get(group) ?? []), option])
    }
    return React.createElement(
      'div',
      null,
      props.renderInput({ InputProps: {}, InputLabelProps: {} }),
      React.createElement('span', { 'data-testid': 'matches-value' }, String(matchesValue)),
      React.createElement('button', { 'data-testid': 'open', onClick: props.onOpen }, 'open'),
      React.createElement('button', { 'data-testid': 'close', onClick: props.onClose }, 'close'),
      React.createElement('input', {
        'data-testid': 'typed-input',
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => props.onInputChange(event, event.target.value)
      }),
      React.createElement('span', { 'data-testid': 'value' }, props.value ? props.getOptionLabel(props.value) : ''),
      React.createElement('span', { 'data-testid': 'clear-text' }, props.clearText),
      props.loading ? React.createElement('span', { 'data-testid': 'loading' }, props.loadingText) : null,
      !props.loading && props.options.length === 0 ? React.createElement('span', { 'data-testid': 'empty' }, props.noOptionsText) : null,
      React.createElement('button', { 'data-testid': 'clear', onClick: () => props.onChange({}, null) }, 'clear'),
      Array.from(groups.entries()).map(([group, options], index) =>
        props.renderGroup({
          key: String(index),
          group,
          children: options.map(option =>
            React.createElement(
              'button',
              { key: option.urn, 'data-testid': `pick-${option.kind}`, onClick: () => props.onChange({}, option) },
              props.renderOption({}, option)
            )
          )
        })
      )
    )
  }
}))

jest.mock('@mui/icons-material/Close', () => ({ __esModule: true, default: () => React.createElement('span', null, 'x') }))

jest.mock('@dcl/hooks', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

jest.mock('../EventForm.styled', () => ({
  EventTextField: ({ label, placeholder, error, helperText, InputProps }: Record<string, any>) =>
    React.createElement(
      'div',
      null,
      React.createElement('input', {
        'aria-label': label,
        placeholder,
        'data-error': String(Boolean(error)),
        'data-helper-text': helperText
      }),
      InputProps?.startAdornment ?? null
    )
}))

jest.mock('./FeaturedItemField.styled', () => ({
  FeaturedAssetGroup: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
  FeaturedAssetGroupLabel: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'group-label' }, children),
  FeaturedAssetGroupItems: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
  FeaturedAssetListbox: 'ul',
  FeaturedAssetPaper: 'div',
  SelectedAssetAdornment: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'selected-adornment' }, children)
}))

jest.mock('./FeaturedAssetThumbnail', () => ({
  FeaturedAssetThumbnail: ({ thumbnails, size }: { thumbnails: string[]; size?: string }) =>
    React.createElement('div', { 'data-testid': 'thumbnail', 'data-count': thumbnails.length, 'data-size': size })
}))

jest.mock('./FeaturedAssetOptionRow', () => ({
  FeaturedAssetOptionRow: ({ option }: { option: FeaturedAssetOption }) => React.createElement('span', null, option.name)
}))

const mockUseFeaturedAssetSearch = jest.fn()
jest.mock('../../../../hooks/useFeaturedAssetSearch', () => ({
  useFeaturedAssetSearch: (...args: unknown[]) => mockUseFeaturedAssetSearch(...args)
}))
/* eslint-enable @typescript-eslint/no-explicit-any */

const CONTRACT = '0x1234567890abcdef1234567890abcdef12345678'
const ITEM_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}:0`
const COLLECTION_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}`

const ITEM_OPTION: FeaturedAssetOption = {
  urn: ITEM_URN,
  name: 'Reindeer Hat',
  kind: 'item',
  thumbnails: ['a.png'],
  creator: '0xaaaa',
  creatorName: 'MetaTiger'
}
const COLLECTION_OPTION: FeaturedAssetOption = {
  urn: COLLECTION_URN,
  name: 'Winter Drop',
  kind: 'collection',
  thumbnails: ['a.png', 'b.png'],
  creator: '0xbbbb'
}

const EMPTY: FeaturedAssetSearchResult = { options: [], isLoading: false, isEmpty: false }

describe('FeaturedItemField', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockUseFeaturedAssetSearch.mockReturnValue(EMPTY)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing is featured yet', () => {
    it('should render the labelled, empty field without a thumbnail', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      expect(screen.getByLabelText('create_event.featured_item_search_label')).toHaveAttribute(
        'placeholder',
        'create_event.featured_item_search_placeholder'
      )
      expect(screen.getByTestId('value')).toHaveTextContent('')
      expect(screen.queryByTestId('selected-adornment')).not.toBeInTheDocument()
    })
  })

  describe('when the owner types', () => {
    // The hook is driven twice per render — once for the live search, once for urn hydration — so
    // these assertions look for the term across the render's calls rather than at a fixed position.
    it('should only search while the dropdown is open', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      mockUseFeaturedAssetSearch.mockClear()
      fireEvent.change(screen.getByTestId('typed-input'), { target: { value: 'hat' } })
      expect(mockUseFeaturedAssetSearch).not.toHaveBeenCalledWith('hat')

      mockUseFeaturedAssetSearch.mockClear()
      fireEvent.click(screen.getByTestId('open'))
      expect(mockUseFeaturedAssetSearch).toHaveBeenCalledWith('hat')

      mockUseFeaturedAssetSearch.mockClear()
      fireEvent.click(screen.getByTestId('close'))
      expect(mockUseFeaturedAssetSearch).not.toHaveBeenCalledWith('hat')
    })
  })

  describe('when results come back', () => {
    beforeEach(() => {
      mockUseFeaturedAssetSearch.mockReturnValue({ options: [ITEM_OPTION, COLLECTION_OPTION], isLoading: false, isEmpty: false })
    })

    it('should head each section with its own label', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      expect(screen.getAllByTestId('group-label').map(node => node.textContent)).toEqual([
        'create_event.featured_item_group_items',
        'create_event.featured_item_group_collections'
      ])
    })

    it('should report the picked item urn to the form', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      fireEvent.click(screen.getByTestId('pick-item'))

      expect(mockOnChange).toHaveBeenCalledWith(ITEM_URN)
    })

    it('should report the picked collection urn to the form', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      fireEvent.click(screen.getByTestId('pick-collection'))

      expect(mockOnChange).toHaveBeenCalledWith(COLLECTION_URN)
    })
  })

  describe('when an asset is selected', () => {
    it('should show its name and thumbnail inside the field', () => {
      mockUseFeaturedAssetSearch.mockReturnValue({ options: [ITEM_OPTION], isLoading: false, isEmpty: false })
      const { rerender } = render(<FeaturedItemField value="" onChange={mockOnChange} />)

      fireEvent.click(screen.getByTestId('pick-item'))
      rerender(<FeaturedItemField value={ITEM_URN} onChange={mockOnChange} />)

      expect(screen.getByTestId('value')).toHaveTextContent('Reindeer Hat')
      expect(screen.getByTestId('selected-adornment')).toBeInTheDocument()
      expect(screen.getByTestId('thumbnail')).toHaveAttribute('data-size', 'small')
    })
  })

  describe('when the selection is cleared', () => {
    it('should report an empty urn to the form', () => {
      render(<FeaturedItemField value={ITEM_URN} onChange={mockOnChange} />)

      fireEvent.click(screen.getByTestId('clear'))

      expect(mockOnChange).toHaveBeenCalledWith('')
    })
  })

  describe('when editing an event that already has a featured item', () => {
    it('should show the raw urn until the marketplace resolves it', () => {
      render(<FeaturedItemField value={ITEM_URN} onChange={mockOnChange} />)

      expect(screen.getByTestId('value')).toHaveTextContent(ITEM_URN)
      expect(mockUseFeaturedAssetSearch).toHaveBeenCalledWith(ITEM_URN)
    })

    it('should upgrade to the resolved name once it arrives', () => {
      mockUseFeaturedAssetSearch.mockReturnValue({ options: [ITEM_OPTION], isLoading: false, isEmpty: false })

      render(<FeaturedItemField value={ITEM_URN} onChange={mockOnChange} />)

      expect(screen.getByTestId('value')).toHaveTextContent('Reindeer Hat')
    })
  })

  describe('when the search is running', () => {
    it('should surface the searching message', () => {
      mockUseFeaturedAssetSearch.mockReturnValue({ options: [], isLoading: true, isEmpty: false })

      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      expect(screen.getByTestId('loading')).toHaveTextContent('create_event.featured_item_searching')
    })
  })

  describe('when the search finds nothing', () => {
    it('should surface the empty message', () => {
      render(<FeaturedItemField value="" onChange={mockOnChange} />)

      expect(screen.getByTestId('empty')).toHaveTextContent('create_event.featured_item_no_results')
    })
  })

  describe('when the form reports a validation error', () => {
    it('should pass it through to the field', () => {
      render(<FeaturedItemField value="nope" onChange={mockOnChange} error helperText="create_event.error_invalid_featured_item" />)

      const input = screen.getByLabelText('create_event.featured_item_search_label')
      expect(input).toHaveAttribute('data-error', 'true')
      expect(input).toHaveAttribute('data-helper-text', 'create_event.error_invalid_featured_item')
    })
  })
})
