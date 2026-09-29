import React from 'react'
import { render, screen } from '@testing-library/react'
import type { CardData, Creator } from '../../../features/places/places.types'
import { Card } from './Card'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    styled,
    Box,
    CircularProgress: () => React.createElement('div', { role: 'progressbar' }),
    Skeleton: () => React.createElement('div'),
    useMobileMediaQuery: () => false
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: () => ({ backgroundColor: undefined })
}))

jest.mock('../../profile/ProfileModal', () => ({
  useOpenProfileModal: () => jest.fn()
}))

jest.mock('../JumpInButton', () => ({
  JumpInButton: ({ children }: { children?: React.ReactNode }) => React.createElement('button', { type: 'button' }, children)
}))

jest.mock('../TextWrapper', () => ({
  TextWrapper: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children)
}))

const placeData: CardData = {
  id: 'place-1',
  type: 'place',
  title: 'Genesis Plaza',
  user_name: 'Unknown',
  coordinates: [10, 20],
  position: '10,20'
}

const creator: Creator = { user: '0xabc', user_name: 'Alice', avatar: undefined }

// Mimics what Chrome's built-in translator and Google Translate do: they swap the
// original text node for their own <font> element holding the translated text.
function translateTextNode(text: string) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node && node.nodeValue !== text) node = walker.nextNode()
  if (!node?.parentNode) throw new Error(`text node "${text}" not found`)
  const font = document.createElement('font')
  font.textContent = text
  node.parentNode.replaceChild(font, node)
}

describe('Card', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the creator has no address', () => {
    it('should render the creator name without a profile link', () => {
      render(<Card data={placeData} />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.queryByLabelText('component.jump.card.accessibility.user_profile_link')).not.toBeInTheDocument()
    })
  })

  describe('when a translator rewrote the creator name and the creator address arrives', () => {
    it('should swap in the profile link without a DOM error', () => {
      const { rerender } = render(<Card data={placeData} />)
      translateTextNode('Unknown')

      expect(() => rerender(<Card data={placeData} creator={creator} />)).not.toThrow()
      expect(screen.getByLabelText('component.jump.card.accessibility.user_profile_link')).toHaveTextContent('Alice')
    })
  })
})
