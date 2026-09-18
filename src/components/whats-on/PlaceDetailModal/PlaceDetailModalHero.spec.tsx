import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { PlaceDetailModalHero } from './PlaceDetailModalHero'
import type { ModalPlaceData } from './PlaceDetailModal.types'

// The share link carries the sharer's wallet, and that chain reaches the env
// config through `import.meta`, which ts-jest cannot parse.
jest.mock('../../../config/env')

const WALLET = '0x1111111111111111111111111111111111111111'
const mockUseWalletAddress = jest.fn()
jest.mock('../../../hooks/useWalletAddress', () => ({
  useWalletAddress: () => mockUseWalletAddress()
}))

const mockBuildPlaceShareUrl = jest.fn()
jest.mock('../../../utils/whatsOnUrl', () => ({
  buildPlaceShareUrl: (...args: unknown[]) => mockBuildPlaceShareUrl(...args)
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (id: string) => id })
}))

jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false
}))

jest.mock('../../jump/JumpInButton', () => ({
  JumpInButton: () => <button type="button">jump-in</button>
}))

jest.mock('../DetailModal', () => ({
  DetailModalCreator: () => <div>creator</div>
}))

jest.mock('../DetailModal/DetailModal.styled', () => ({
  ActionsRow: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BackButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="back-button" {...props} />,
  CloseButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="close-button" {...props} />,
  CloseIconStyled: () => <span>close</span>,
  CopyButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button data-testid="copy-button" {...props} />,
  CopyIconStyled: () => <span>copy</span>,
  HeroContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  HeroImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
  HeroOverlay: () => <div />,
  HeroSection: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ModalTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>
}))

jest.mock('decentraland-ui2', () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ breakpoints: { down: () => '(max-width:0px)' } })
}))

function createData(overrides: Partial<ModalPlaceData> = {}): ModalPlaceData {
  return {
    id: 'place-1',
    title: 'Wonder Museum',
    description: 'Art',
    image: 'https://example.com/cover.png',
    coordinates: [10, 43],
    isWorld: false,
    worldName: null,
    ...overrides
  } as ModalPlaceData
}

describe('PlaceDetailModalHero', () => {
  let writeText: jest.Mock

  beforeEach(() => {
    mockUseWalletAddress.mockReturnValue({ address: null, isConnected: false, disconnect: jest.fn() })
    mockBuildPlaceShareUrl.mockReturnValue('http://localhost/events?position=10,43')
    writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the share button is clicked', () => {
    it('should share the place deep link', async () => {
      render(<PlaceDetailModalHero data={createData()} onClose={jest.fn()} />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('copy-button'))
      })

      expect(writeText).toHaveBeenCalledWith('http://localhost/events?position=10,43')
    })

    describe('and the sharer is connected', () => {
      beforeEach(() => {
        mockUseWalletAddress.mockReturnValue({ address: WALLET, isConnected: true, disconnect: jest.fn() })
      })

      it('should credit them so a shared place keeps its referral', async () => {
        render(<PlaceDetailModalHero data={createData()} onClose={jest.fn()} />)

        await act(async () => {
          fireEvent.click(screen.getByTestId('copy-button'))
        })

        expect(writeText).toHaveBeenCalledWith(`http://localhost/events?position=10,43&referrer=${WALLET}`)
      })

      it('should credit them on a world link too', async () => {
        mockBuildPlaceShareUrl.mockReturnValue('http://localhost/events?world=foo.dcl.eth')
        render(<PlaceDetailModalHero data={createData({ isWorld: true, worldName: 'foo.dcl.eth' })} onClose={jest.fn()} />)

        await act(async () => {
          fireEvent.click(screen.getByTestId('copy-button'))
        })

        expect(writeText).toHaveBeenCalledWith(`http://localhost/events?world=foo.dcl.eth&referrer=${WALLET}`)
      })
    })
  })
})
