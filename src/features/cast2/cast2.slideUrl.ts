const SLIDE_PATH = /^\/presentations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/slides\/[0-9a-f]{16}\.png$/

/** Returns whether `url` is a slide image served by the presenter server at `presenterServerUrl`. */
const isAllowedSlideUrl = (url: string, presenterServerUrl: string): boolean => {
  try {
    const { origin, pathname, search, hash } = new URL(url)
    return origin === new URL(presenterServerUrl).origin && SLIDE_PATH.test(pathname) && search === '' && hash === ''
  } catch {
    return false
  }
}

export { isAllowedSlideUrl }
