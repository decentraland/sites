import { render, screen } from '@testing-library/react'
import { ProfileModalHostProvider, useProfileModalHostAvailable } from './ProfileModalHostContext'

function Probe() {
  return <span data-testid="host">{String(useProfileModalHostAvailable())}</span>
}

describe('ProfileModalHostContext', () => {
  describe('when rendered without a provider', () => {
    it('should default to false', () => {
      render(<Probe />)
      expect(screen.getByTestId('host')).toHaveTextContent('false')
    })
  })

  describe('when rendered inside ProfileModalHostProvider', () => {
    it('should expose true', () => {
      render(
        <ProfileModalHostProvider>
          <Probe />
        </ProfileModalHostProvider>
      )
      expect(screen.getByTestId('host')).toHaveTextContent('true')
    })
  })
})
