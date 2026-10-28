/**
 * Returns a CSS-safe url() value for use in backgroundImage.
 * Only allows https URLs; double-quotes are percent-encoded to prevent
 * CSS injection via a URL containing `")` sequences.
 */
const safeCssUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return ''
    return parsed.toString().replace(/"/g, '%22')
  } catch {
    return ''
  }
}

export { safeCssUrl }
