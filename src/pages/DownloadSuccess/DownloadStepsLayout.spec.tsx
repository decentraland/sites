import { render, screen, within } from '@testing-library/react'
import { DownloadStepsLayout } from './DownloadStepsLayout'
import type { DownloadStepsStep } from './DownloadSuccess.types'

// The ui2 package is ESM and cannot load in jest, so its `styled` is the shared shim: this renders the
// real layout and the real DownloadSteps.styled.ts (only the style engine is replaced).
jest.mock('decentraland-ui2', () => {
  const { createUi2Mock } = jest.requireActual('../../__test-utils__/ui2Mock')
  const ui2Mock = createUi2Mock()
  return {
    ...ui2Mock,
    dclColors: { ...ui2Mock.dclColors, brand: { lavender: '#C640CD', ruby: '#FF2D55' } },
    Logo: () => <svg data-testid="header-logo" />
  }
})

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./DownloadSuccess.styled', () => ({
  DownloadBackdrop: ({ open, children }: { open: boolean; children: React.ReactNode }) => (
    <div data-testid="backdrop" data-open={String(open)}>
      {children}
    </div>
  ),
  DownloadBackdropContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadBackdropText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DownloadDetailContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadProgressBar: () => <div role="progressbar" />,
  DownloadProgressContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

const STEPS: DownloadStepsStep[] = [
  { title: 'First title', text: 'First text', image: 'one.webp', imageFit: 'cover', highlight: { x: 25, y: 75 } },
  { title: 'Second title', text: 'Second text', image: 'two.webp', imageFit: 'contain' },
  { title: 'Third title', text: 'Third text', image: 'three.webp', imageFit: 'cover' }
]

const renderLayout = (props: Partial<React.ComponentProps<typeof DownloadStepsLayout>> = {}) =>
  render(
    <DownloadStepsLayout
      loading={false}
      title="Page title"
      subtitle="Page subtitle"
      steps={STEPS}
      footer={<a href="/somewhere">Footer link</a>}
      afterContent={<div data-testid="after" />}
      {...props}
    />
  )

describe('when rendering the steps layout', () => {
  it('should render the header logo, title and subtitle', () => {
    renderLayout()

    expect(screen.getByTestId('header-logo')).toBeInTheDocument()
    expect(screen.getByText('Page title')).toBeInTheDocument()
    expect(screen.getByText('Page subtitle')).toBeInTheDocument()
  })

  it('should render the footer and the content after the page', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Footer link' })).toBeInTheDocument()
    expect(screen.getByTestId('after')).toBeInTheDocument()
  })

  it('should render one card per step with its numbered overline, title and text', () => {
    renderLayout()

    STEPS.forEach((step, index) => {
      expect(screen.getByText(`page.download.success.step ${index + 1}`)).toBeInTheDocument()
      expect(screen.getByText(step.title as string)).toBeInTheDocument()
      expect(screen.getByText(step.text as string)).toBeInTheDocument()
    })
  })

  it('should render each step image with its fit and no alternative text', () => {
    const { container } = renderLayout()

    const images = [...container.querySelectorAll('img[loading="lazy"]')]

    expect(images.map(image => image.getAttribute('src'))).toEqual(['one.webp', 'two.webp', 'three.webp'])
    expect(images.map(image => image.getAttribute('fit'))).toEqual(['cover', 'contain', 'cover'])
    expect(images.every(image => image.getAttribute('alt') === '')).toBe(true)
  })

  describe('and a step has a highlight', () => {
    it('should render the glow and the icon disc at the highlight position of that step only', () => {
      renderLayout()

      const highlight = screen.getByTestId('download-steps-highlight')

      expect(screen.getAllByTestId('download-steps-highlight')).toHaveLength(1)
      expect(highlight).toHaveAttribute('x', '25')
      expect(highlight).toHaveAttribute('y', '75')
      expect(highlight.querySelector('span')).toBeInTheDocument()
      expect(within(highlight).getByRole('presentation')).toHaveAttribute('src', 'highlight-icon.webp')
    })
  })

  describe('and no step has a highlight', () => {
    it('should not render any highlight', () => {
      renderLayout({ steps: STEPS.map(({ highlight: _highlight, ...step }) => step) })

      expect(screen.queryByTestId('download-steps-highlight')).not.toBeInTheDocument()
    })
  })

  describe('and the page is loading', () => {
    describe('and no backdrop content is given', () => {
      it('should show the default downloading indicator in the backdrop', () => {
        renderLayout({ loading: true })

        expect(screen.getByTestId('backdrop')).toHaveAttribute('data-open', 'true')
        expect(within(screen.getByTestId('backdrop')).getByText('page.download.downloading')).toBeInTheDocument()
      })
    })

    describe('and backdrop content is given', () => {
      it('should show it instead of the default indicator', () => {
        renderLayout({ loading: true, backdropContent: <p>Custom progress</p> })

        expect(within(screen.getByTestId('backdrop')).getByText('Custom progress')).toBeInTheDocument()
        expect(screen.queryByText('page.download.downloading')).not.toBeInTheDocument()
      })
    })
  })

  describe('and the page is not loading', () => {
    it('should not mount the backdrop content (its logo would otherwise come first in the DOM)', () => {
      renderLayout({ loading: false, backdropContent: <p>Custom progress</p> })

      expect(screen.getByTestId('backdrop')).toHaveAttribute('data-open', 'false')
      expect(screen.getByTestId('backdrop')).toBeEmptyDOMElement()
      expect(screen.getAllByTestId('header-logo')).toHaveLength(1)
    })
  })
})
