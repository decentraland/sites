import { fireEvent, render, screen } from '@testing-library/react'
import { CreatorByLineName } from './CreatorByLineName'

const mockOpenProfile = jest.fn()
jest.mock('../../profile/ProfileModal/useOpenProfileModal', () => ({
  useOpenProfileModal: () => mockOpenProfile
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

const ADDRESS = '0x1111111111111111111111111111111111111111'

describe('CreatorByLineName', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the place resolves a creator wallet', () => {
    it('should open that profile on click', () => {
      render(<CreatorByLineName name="Alice" address={ADDRESS} />)

      fireEvent.click(screen.getByRole('button', { name: 'Alice' }))

      expect(mockOpenProfile).toHaveBeenCalledWith(ADDRESS)
    })

    it('should keep the click off the surrounding card, which navigates into the scene', () => {
      const onCardClick = jest.fn()
      render(
        <div onClick={onCardClick}>
          <CreatorByLineName name="Alice" address={ADDRESS} />
        </div>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Alice' }))

      expect(mockOpenProfile).toHaveBeenCalledWith(ADDRESS)
      expect(onCardClick).not.toHaveBeenCalled()
    })
  })

  describe('when the card has traded its by-line for the JUMP IN CTA', () => {
    it('should leave the tab order, since the row is transparent and pointer-blocked', () => {
      render(<CreatorByLineName name="Alice" address={ADDRESS} inactive />)

      expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('when the place names no wallet', () => {
    it('should render the name as plain text rather than a control that opens nothing', () => {
      render(<CreatorByLineName name="Alice" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
