import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DCL_FOUNDATION_LOGO_URL } from '../../../features/events/events.helpers'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { getSyntheticAvatarUrl } from '../../../utils/avatarColor'
import { normalizeJumpPlace } from './normalizers'
import { PlaceDetailModalCreator } from './PlaceDetailModalCreator'
import type { ModalPlaceData } from './PlaceDetailModal.types'

jest.mock('../../../features/profile/profile.client', () => ({ useGetProfileQuery: jest.fn() }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('../DetailModal/DetailModal.styled', () => ({
  CreatorRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CreatorName: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AvatarImage: ({ fallbackColor, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackColor?: string }) => (
    <img {...props} data-background-color={fallbackColor} />
  )
}))
let mockOpenProfile: jest.Mock
jest.mock('../../profile/ProfileModal/useOpenProfileModal', () => ({ useOpenProfileModal: () => mockOpenProfile }))
const mockUseGetProfileQuery = useGetProfileQuery as jest.Mock

describe('when rendering the events place modal creator', () => {
  let data: ModalPlaceData
  let ownerAddress: string

  beforeEach(() => {
    mockOpenProfile = jest.fn()
    ownerAddress = '0x1e105bb213754519903788022b962fe2b9c4b263'
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each(['SDK', ' sdk ', '', undefined])('and the world contact is %p', contactName => {
    beforeEach(() => {
      data = normalizeJumpPlace({
        id: 'monster-recon',
        title: 'Monster Recon',
        image: '',
        description: '',
        positions: [],
        base_position: '0,0',
        world: true,
        world_name: 'monsterrecon.dcl.eth',
        owner: ownerAddress,
        contact_name: contactName
      })
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'BayBackner', avatar: { snapshots: { face256: 'https://example.com/bay.png' } } }] }
      })
      render(<PlaceDetailModalCreator data={data} prefixLabel="By " />)
    })

    it('should credit Monster Recon instead of the wallet profile', () => {
      expect(screen.getByText('By', { exact: false })).toHaveTextContent('By Monster Recon')
      expect(screen.queryByText('BayBackner')).not.toBeInTheDocument()
    })

    it('should use the synthetic title avatar', () => {
      expect(screen.getByRole('img', { name: 'Monster Recon' })).toHaveAttribute('src', getSyntheticAvatarUrl('Monster Recon'))
    })

    it('should skip the wallet profile query', () => {
      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })

    it('should render the credit without a profile button', () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('and the scene declares an author', () => {
    beforeEach(() => {
      data = {
        id: 'scene',
        title: 'Scene',
        description: null,
        image: null,
        coordinates: [0, 0],
        ownerAddress,
        contactName: 'Alice',
        favorites: 0,
        userCount: 0,
        isWorld: false,
        worldName: null
      }
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'StudioWallet', avatar: { snapshots: { face256: 'https://example.com/studio.png' } } }] }
      })
      render(<PlaceDetailModalCreator data={data} prefixLabel="By " />)
    })

    it('should credit the declared author with the wallet face', () => {
      expect(screen.getByRole('img', { name: 'Alice' })).toHaveAttribute('src', 'https://example.com/studio.png')
    })

    it('should open the credited profile', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Alice' }))
      expect(mockOpenProfile).toHaveBeenCalledWith(ownerAddress)
    })
  })

  describe('and the Foundation is the declared author', () => {
    beforeEach(() => {
      data = {
        id: 'plaza',
        title: 'Genesis Plaza',
        description: null,
        image: null,
        coordinates: [0, 0],
        ownerAddress,
        contactName: 'Decentraland Foundation',
        favorites: 0,
        userCount: 0,
        isWorld: false,
        worldName: null
      }
      render(<PlaceDetailModalCreator data={data} prefixLabel="By " />)
    })

    it('should show the Foundation logo', () => {
      expect(screen.getByRole('img', { name: 'Decentraland Foundation' })).toHaveAttribute('src', DCL_FOUNDATION_LOGO_URL)
    })

    it('should omit the profile button', () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('and neither an author nor a title is available', () => {
    beforeEach(() => {
      data = {
        id: 'empty',
        title: '',
        description: null,
        image: null,
        coordinates: [0, 0],
        ownerAddress,
        contactName: undefined,
        favorites: 0,
        userCount: 0,
        isWorld: false,
        worldName: null
      }
      render(<PlaceDetailModalCreator data={data} prefixLabel="By " />)
    })

    it('should omit the by-line', () => {
      expect(screen.queryByText('By', { exact: false })).not.toBeInTheDocument()
    })
  })
})
