import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { LegalPageLayout } from './LegalPageLayout'
import { Paragraph, Section, SectionTitle } from './LegalPage.styled'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => React.createElement('p', rest, children)
  return { styled, Box, Typography }
})

jest.mock('@mui/icons-material/Balance', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/CardGiftcard', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Explore', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Favorite', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Park', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Redeem', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Shield', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/Token', () => () => React.createElement('span'))
jest.mock('@mui/icons-material/VpnKey', () => () => React.createElement('span'))

const renderLayout = (props: Partial<React.ComponentProps<typeof LegalPageLayout>> = {}) =>
  render(
    <MemoryRouter>
      <LegalPageLayout
        title="Content Policy"
        activeSlug="/content"
        tableOfContents={[{ id: 'definitions', label: '1. Definitions' }]}
        {...props}
      >
        <Section id="definitions">
          <SectionTitle>1. Definitions</SectionTitle>
          <Paragraph>Content shall mean any work of authorship.</Paragraph>
        </Section>
      </LegalPageLayout>
    </MemoryRouter>
  )

describe('when rendering a legal page', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should title the document with a level one heading', () => {
    renderLayout()
    expect(screen.getByRole('heading', { level: 1, name: 'Content Policy' })).toBeInTheDocument()
  })

  it('should render the section titles as level two headings below it', () => {
    renderLayout()
    expect(screen.getByRole('heading', { level: 2, name: '1. Definitions' })).toBeInTheDocument()
  })

  it('should render the body passed as children', () => {
    renderLayout()
    expect(screen.getByText('Content shall mean any work of authorship.')).toBeInTheDocument()
  })

  it('should link every table of contents entry to its section anchor', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: '1. Definitions' })).toHaveAttribute('href', '#definitions')
  })

  it('should omit the table of contents when there are no entries', () => {
    renderLayout({ tableOfContents: [] })
    expect(screen.queryByRole('link', { name: '1. Definitions' })).not.toBeInTheDocument()
  })

  it('should render a sidebar link for the active page', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Content Policy' })).toHaveAttribute('href', '/content')
  })
})
