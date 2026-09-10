import React from 'react'
import { render, screen } from '@testing-library/react'
import type { FeaturedAssetOption } from '../../../../hooks/useFeaturedAssetSearch.types'
import { FeaturedAssetOptionRow } from './FeaturedAssetOptionRow'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => (values ? `${key}:${Object.values(values).join(',')}` : key)
  })
}))

jest.mock('./FeaturedItemField.styled', () => ({
  FeaturedAssetRow: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement('li', { 'data-testid': 'asset-row', ...props }, children),
  FeaturedAssetTexts: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
  FeaturedAssetName: ({ children, title }: { children?: React.ReactNode; title?: string }) =>
    React.createElement('span', { 'data-testid': 'asset-name', title }, children),
  FeaturedAssetCreator: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'asset-creator' }, children)
}))

jest.mock('./FeaturedAssetThumbnail', () => ({
  FeaturedAssetThumbnail: ({ thumbnails }: { thumbnails: string[] }) =>
    React.createElement('div', { 'data-testid': 'asset-thumbnail', 'data-count': thumbnails.length })
}))

const OPTION: FeaturedAssetOption = {
  urn: 'urn:decentraland:matic:collections-v2:0x1234567890abcdef1234567890abcdef12345678:0',
  name: 'Reindeer Hat',
  kind: 'item',
  thumbnails: ['a.png'],
  creator: '0xaaaa',
  creatorName: 'MetaTiger'
}

describe('FeaturedAssetOptionRow', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the creator has a profile name', () => {
    it('should credit the name', () => {
      render(<FeaturedAssetOptionRow option={OPTION} />)

      expect(screen.getByTestId('asset-name')).toHaveTextContent('Reindeer Hat')
      expect(screen.getByTestId('asset-creator')).toHaveTextContent('create_event.featured_item_by:MetaTiger')
      expect(screen.getByTestId('asset-thumbnail')).toHaveAttribute('data-count', '1')
    })
  })

  describe('and the creator has no profile name', () => {
    it('should fall back to crediting the address', () => {
      render(<FeaturedAssetOptionRow option={{ ...OPTION, creatorName: undefined }} />)

      expect(screen.getByTestId('asset-creator')).toHaveTextContent('create_event.featured_item_by:0xaaaa')
    })
  })

  describe('and the option is an unresolved pasted urn', () => {
    it('should omit the credit line entirely', () => {
      render(<FeaturedAssetOptionRow option={{ ...OPTION, creator: '', creatorName: undefined }} />)

      expect(screen.queryByTestId('asset-creator')).not.toBeInTheDocument()
    })
  })

  describe('when the listbox passes its own props', () => {
    it('should forward them to the row element', () => {
      render(<FeaturedAssetOptionRow option={OPTION} id="option-0" aria-selected />)

      expect(screen.getByTestId('asset-row')).toHaveAttribute('id', 'option-0')
    })
  })

  describe('when the name is long enough to be clipped', () => {
    it('should expose the full name as a tooltip', () => {
      render(<FeaturedAssetOptionRow option={OPTION} />)

      expect(screen.getByTestId('asset-name')).toHaveAttribute('title', 'Reindeer Hat')
    })
  })
})
