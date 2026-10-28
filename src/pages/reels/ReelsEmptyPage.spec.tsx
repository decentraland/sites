import { render, screen } from '@testing-library/react'
import { ReelsEmptyPage } from './ReelsEmptyPage'

jest.mock('../../components/Reels/NotPhoto', () => ({
  NotPhoto: () => <div data-testid="reels-not-photo" />
}))

jest.mock('../../hooks/usePageView', () => ({
  usePageView: () => {}
}))

describe('ReelsEmptyPage', () => {
  it('should render the NotPhoto fallback', () => {
    render(<ReelsEmptyPage />)

    expect(screen.getByTestId('reels-not-photo')).toBeTruthy()
  })

  it('should set the reels document title and restore the previous one on unmount', () => {
    document.title = 'previous-title'

    const { unmount } = render(<ReelsEmptyPage />)
    expect(document.title).toBe('Decentraland Reels')

    unmount()
    expect(document.title).toBe('previous-title')
  })
})
