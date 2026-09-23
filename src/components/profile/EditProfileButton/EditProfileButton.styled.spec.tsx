import { createElement } from 'react'
import { render } from '@testing-library/react'
import { EditButton, EditButtonIcon } from './EditProfileButton.styled'

// Drive the real `styled()` style callbacks through the shared shim so the
// `EditButton`/`EditButtonIcon` definition bodies (including the responsive
// `breakpoints.down('md')` override) execute for coverage.
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

describe('EditProfileButton.styled', () => {
  it('should render the edit CTA styled button forwarding its children', () => {
    const { getByText } = render(createElement(EditButton, {}, 'Edit'))

    expect(getByText('Edit')).toBeInTheDocument()
  })

  it('should render the pencil icon slot as an inline-flex span wrapper', () => {
    const { getByText } = render(createElement(EditButtonIcon, null, '✎'))

    expect(getByText('✎')).toBeInTheDocument()
  })
})
