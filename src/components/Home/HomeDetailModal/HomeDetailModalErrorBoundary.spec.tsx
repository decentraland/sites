import { render, screen } from '@testing-library/react'
import { HomeDetailModalErrorBoundary } from './HomeDetailModalErrorBoundary'

const Boom = () => {
  throw new Error('chunk failed')
}

const onError = jest.fn()

describe('when rendering the home detail modal error boundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and its children render', () => {
    beforeEach(() => {
      render(
        <HomeDetailModalErrorBoundary onError={onError}>
          <div>fine</div>
        </HomeDetailModalErrorBoundary>
      )
    })

    it('should render them and not report anything', () => {
      expect(screen.getByText('fine')).toBeInTheDocument()
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('and a child throws', () => {
    beforeEach(() => {
      render(
        <HomeDetailModalErrorBoundary onError={onError}>
          <Boom />
        </HomeDetailModalErrorBoundary>
      )
    })

    it('should report the error once and render nothing', () => {
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'chunk failed' }))
      expect(screen.queryByText('fine')).toBeNull()
    })
  })
})
