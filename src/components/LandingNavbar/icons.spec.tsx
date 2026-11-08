import { render, screen } from '@testing-library/react'
import * as icons from './icons'

describe.each(Object.entries(icons))('when rendering the %s icon', (name, Icon) => {
  beforeEach(() => {
    render(<Icon role="img" aria-label={name} />)
  })

  it('should render an svg that receives the props it is given', () => {
    expect(screen.getByRole('img', { name })).toBeInstanceOf(SVGSVGElement)
  })
})
