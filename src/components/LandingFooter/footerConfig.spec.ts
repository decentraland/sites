import { gettingStartedLinks, resourceLinks, socialLinks } from './footerConfig'

// Literal snapshot of every footer URL. Some of them are sourced from src/config/publicLinks.json,
// which llms.txt reads too; this keeps that sharing invisible to the footer.
describe('when reading the footer links', () => {
  it('should keep every social URL', () => {
    expect(socialLinks.map(link => link.url)).toEqual([
      'https://dcl.gg/discord',
      'https://github.com/decentraland',
      'https://x.com/decentraland',
      'https://instagram.com/decentraland_foundation/',
      'https://youtube.com/@decentraland_foundation',
      'https://tiktok.com/@decentraland_fdn',
      'https://linkedin.com/company/decentralandorg'
    ])
  })

  it('should keep every getting started URL', () => {
    expect(gettingStartedLinks.map(link => link.url)).toEqual([
      'https://docs.decentraland.org/introduction/about-decentraland',
      '/download',
      'https://docs.decentraland.org/in-world/settings-and-performance',
      'https://docs.decentraland.org/faqs/decentraland-101',
      'https://decentraland.org/help/'
    ])
  })

  it('should keep every resource URL', () => {
    expect(resourceLinks.map(link => link.url)).toEqual([
      'https://decentraland.org/marketplace',
      'https://decentraland.org/create/',
      'https://docs.decentraland.org',
      'https://decentraland.org/blog/',
      'https://decentraland.org/dao'
    ])
  })
})
