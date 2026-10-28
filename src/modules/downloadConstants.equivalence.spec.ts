import { DOWNLOAD_URLS } from './downloadConstants'

// Literal snapshots of the store URLs as the site emitted them before the links moved into
// src/config/publicLinks.json. Any drift here changes attribution in production.
const PLAY_DEFAULT =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_org=dclrgl&utm_source=fdn&utm_medium=qr&utm_campaign=dclpage&utm_content=android&referrer=utm_org%3Ddclrgl%26utm_source%3Dfdn%26utm_medium%3Dqr%26utm_campaign%3Ddclpage%26utm_content%3Dandroid'
const PLAY_WITH_CAMPAIGN =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_org=dclrgl&utm_source=partner_x&utm_medium=paid&utm_campaign=fall-launch&utm_content=android&utm_term=vr&referrer=utm_org%3Ddclrgl%26utm_source%3Dpartner_x%26utm_medium%3Dpaid%26utm_campaign%3Dfall-launch%26utm_content%3Dandroid%26utm_term%3Dvr'
const APP_STORE = 'https://apps.apple.com/app/apple-store/id6478403840?pt=126284288&ct=Decentraland%20Home%20iOS&mt=8'

const utmSetOf = (url: string) =>
  [...new URL(url).searchParams.entries()].filter(([key]) => key.startsWith('utm_')).map(([key, value]) => `${key}=${value}`)

describe('when reading the store URLs the site hands off to', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('and the visitor arrived without campaign params', () => {
    it('should return the exact default Play Store URL', () => {
      expect(DOWNLOAD_URLS.googlePlay).toBe(PLAY_DEFAULT)
    })

    it('should mirror the full final utm set into the decoded referrer', () => {
      const referrer = new URLSearchParams(new URL(DOWNLOAD_URLS.googlePlay).searchParams.get('referrer') ?? '')
      expect([...referrer.entries()].map(([key, value]) => `${key}=${value}`)).toEqual(utmSetOf(DOWNLOAD_URLS.googlePlay))
    })
  })

  describe('and the visitor arrived with campaign params', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/?utm_source=Partner%20X&utm_medium=PAID&utm_campaign=Fall-Launch&utm_term=VR')
    })

    it('should overlay the normalized campaign onto the default tag', () => {
      expect(DOWNLOAD_URLS.googlePlay).toBe(PLAY_WITH_CAMPAIGN)
    })

    it('should mirror the full final utm set into the decoded referrer', () => {
      const referrer = new URLSearchParams(new URL(DOWNLOAD_URLS.googlePlay).searchParams.get('referrer') ?? '')
      expect([...referrer.entries()].map(([key, value]) => `${key}=${value}`)).toEqual(utmSetOf(DOWNLOAD_URLS.googlePlay))
    })

    it('should compute the Play Store URL fresh on every read', () => {
      expect(DOWNLOAD_URLS.googlePlay).toBe(PLAY_WITH_CAMPAIGN)
      window.history.pushState({}, '', '/')
      expect(DOWNLOAD_URLS.googlePlay).toBe(PLAY_DEFAULT)
    })
  })

  it('should return the exact App Store URL', () => {
    expect(DOWNLOAD_URLS.appStore).toBe(APP_STORE)
  })

  it('should return the exact desktop and Epic URLs', () => {
    expect(DOWNLOAD_URLS.windows).toBe('https://decentraland.org/download')
    expect(DOWNLOAD_URLS.apple).toBe('https://decentraland.org/download')
    expect(DOWNLOAD_URLS.epic).toBe('https://store.epicgames.com/en-US/p/decentraland-b692fb')
  })
})
