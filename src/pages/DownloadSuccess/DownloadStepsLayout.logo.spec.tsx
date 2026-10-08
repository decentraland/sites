import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render } from '@testing-library/react'
import { DownloadStepsLayout } from './DownloadStepsLayout'

// Renders the REAL ui2 Logo (the rest of ui2 is the repo's shim): the closed backdrop mounts a Logo before the header one.
jest.mock('decentraland-ui2', () => {
  const { createUi2Mock } = jest.requireActual('../../__test-utils__/ui2Mock')
  const ui2Mock = createUi2Mock()
  return {
    ...ui2Mock,
    dclColors: { ...ui2Mock.dclColors, brand: { lavender: '#C640CD', ruby: '#FF2D55' } },
    Logo: jest.requireActual('decentraland-ui2/dist/components/Logo/Logo').Logo
  }
})

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./DownloadSuccess.styled', () => ({
  DownloadBackdrop: ({ open, children }: { open: boolean; children: React.ReactNode }) => (
    <div data-testid="backdrop" data-open={String(open)} style={open ? undefined : { display: 'none' }}>
      {children}
    </div>
  ),
  DownloadBackdropContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadBackdropText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DownloadDetailContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadProgressBar: () => <div role="progressbar" />,
  DownloadProgressContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('when the steps layout is closed and both the backdrop and the header mount a Logo', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = render(
      <ThemeProvider theme={createTheme()}>
        <DownloadStepsLayout loading={false} title="Title" subtitle="Subtitle" steps={[]} footer={null} />
      </ThemeProvider>
    ).container
  })

  it('should give every Logo its own gradient ids', () => {
    const ids = [...container.querySelectorAll('linearGradient')].map(gradient => gradient.id)

    expect(ids).toHaveLength(6)
    expect(new Set(ids).size).toBe(6)
  })

  it('should fill the header Logo with a gradient that exists exactly once', () => {
    const headerLogo = [...container.querySelectorAll('svg')].find(svg => !svg.closest('[data-testid="backdrop"]'))
    const references = [...(headerLogo?.querySelectorAll('path') ?? [])]
      .map(shape => shape.getAttribute('fill'))
      .filter((fill): fill is string => Boolean(fill?.startsWith('url(#')))
      .map(fill => fill.slice(5, -1))

    expect(references).toHaveLength(3)
    references.forEach(id => expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1))
  })
})
