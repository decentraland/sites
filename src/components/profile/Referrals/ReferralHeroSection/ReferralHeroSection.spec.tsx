import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { ReferralHeroSection } from './ReferralHeroSection'

jest.mock('../../../../utils/assetUrl', () => ({
  assetUrl: (path: string) => `https://cdn.test${path}`
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('decentraland-ui2', () => {
  const passthrough = (props: { children?: React.ReactNode }) => mockReact.createElement('div', null, props.children)
  return {
    Box: passthrough,
    InputAdornment: passthrough,
    Menu: passthrough,
    MenuItem: passthrough,
    Tooltip: passthrough,
    Typography: passthrough,
    useTabletAndBelowMediaQuery: () => false
  }
})

// Render the image styled components as real <img> so we can assert the
// resolved `src`; everything else is a transparent wrapper.
jest.mock('./ReferralHeroSection.styled', () => {
  const wrapper = (props: { children?: React.ReactNode }) => mockReact.createElement('div', null, props.children)
  const image = ({ src, alt }: { src?: string; alt?: string }) => mockReact.createElement('img', { src, alt })
  return {
    EnvelopeImage: image,
    EnvelopeImageContainer: wrapper,
    EnvelopeShadow: wrapper,
    HeroWrapper: wrapper,
    HowItWorksButton: wrapper,
    ReferralButton: wrapper,
    ReferralContainer: wrapper,
    ReferralInput: () => mockReact.createElement('input'),
    SectionContainer: wrapper,
    Step: wrapper,
    StepImage: image,
    StepNumber: wrapper,
    StepText: wrapper,
    StepTextContainer: wrapper,
    StepsContainer: wrapper,
    Subtitle: wrapper,
    Title: wrapper,
    TooltipLink: wrapper
  }
})

describe('ReferralHeroSection', () => {
  // Regression for the broken envelope icon (#584) on CDN deploys: the hero
  // envelope must resolve through `assetUrl` so it points at the CDN base.
  it('should resolve the hero envelope image through assetUrl', () => {
    render(<ReferralHeroSection profileAddress="0x1234567890123456789012345678901234567890" />)

    expect(screen.getByAltText('Envelope')).toHaveAttribute('src', 'https://cdn.test/images/referrals/referral-envelope.webp')
  })

  // Regression for the broken "how it works" step images (#586).
  it('should resolve every step image through assetUrl', () => {
    render(<ReferralHeroSection profileAddress="0x1234567890123456789012345678901234567890" />)

    expect(screen.getByAltText('Step 1')).toHaveAttribute('src', 'https://cdn.test/images/referrals/referral-envelope.webp')
    expect(screen.getByAltText('Step 2')).toHaveAttribute('src', 'https://cdn.test/images/referrals/logo-with-pointer.webp')
    expect(screen.getByAltText('Step 3')).toHaveAttribute('src', 'https://cdn.test/images/referrals/sports-medal.webp')
  })
})
