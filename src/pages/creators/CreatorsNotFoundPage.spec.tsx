import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatorsNotFoundPage } from './CreatorsNotFoundPage'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>
}))

jest.mock('./CreatorsNotFoundPage.styled', () => ({
  NotFoundContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  NotFoundTitle: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
  NotFoundDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>
}))

describe('CreatorsNotFoundPage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the not-found copy', () => {
    render(
      <MemoryRouter>
        <CreatorsNotFoundPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'page.creators.not_found.title' })).toBeInTheDocument()
    expect(screen.getByText('page.creators.not_found.description')).toBeInTheDocument()
  })

  it('should navigate back to creations on button click', async () => {
    render(
      <MemoryRouter>
        <CreatorsNotFoundPage />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: 'page.creators.world.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/creators')
  })
})
